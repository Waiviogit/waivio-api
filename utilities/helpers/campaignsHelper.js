const moment = require('moment');
const _ = require('lodash');
const {
  User, Wobj, paymentHistory, Campaign, App,
} = require('models');
const { RESERVATION_STATUSES, PAYMENT_HISTORIES_TYPES } = require('constants/campaignsData');
const { REQUIREDFIELDS_POST, REQUIREDFIELDS_SIMPLIFIED } = require('constants/wobjectsData');

const wobjectHelper = require('./wObjectHelper');

exports.campaignValidation = (campaign) => !!(campaign.reservation_timetable[moment().format('dddd').toLowerCase()]
    && _.floor(campaign.budget / campaign.reward) > _.filter(campaign.users,
      (user) => (user.status === 'assigned' || user.status === 'completed')
        && user.createdAt > moment().startOf('month')).length);

exports.requirementFilters = async (campaign, user, restaurant) => {
  let frequency = null, notBlacklisted = true, assignedUser, daysPassed;
  if (user && user.name) {
    user.wobjects_weight = user.wobjects_weight < 0 ? 0 : user.wobjects_weight;
    notBlacklisted = !_.includes(campaign.blacklist_users, user.name);
    ({ lastCompleted: frequency, assignedUser } = await getCompletedUsersInSameCampaigns(
      campaign.guideName, campaign.requiredObject, user.name,
    ));
    daysPassed = Math.trunc((new Date().valueOf() - new Date(frequency).valueOf()) / 86400000);
  }
  const canAssignByBudget = _.floor(campaign.budget / campaign.reward) > _.filter(campaign.users,
    (usr) => (usr.status === 'assigned' || usr.status === 'completed')
      && usr.createdAt > moment().startOf('month')).length;

  const result = {
    can_assign_by_current_day: !!campaign.reservation_timetable[moment().format('dddd').toLowerCase()],
    can_assign_by_budget: canAssignByBudget,
    posts: user ? user.count_posts >= campaign.userRequirements.minPosts : false,
    followers: user ? user.count_posts >= campaign.userRequirements.minPosts : false,
    expertise: user ? user.wobjects_weight >= campaign.userRequirements.minExpertise : false,
    freeReservation: !assignedUser,
    frequency: _.isNumber(daysPassed) ? daysPassed >= campaign.frequency_assign : true,
    not_blacklisted: notBlacklisted,
  };
  return restaurant ? [this.campaignValidation(campaign), ...Object.values(result)] : result;
};

exports.campaignFilter = async (campaigns, user, app) => {
  const validCampaigns = [];
  await Promise.all(campaigns.map(async (campaign) => {
    if (this.campaignValidation(campaign)) {
      const { result, error } = await Wobj.findOne(campaign.requiredObject);
      if (error || !result) return;
      campaign.required_object = await wobjectHelper.processWobjects({
        wobjects: [result], app, returnArray: false, fields: REQUIREDFIELDS_POST,
      });
      const { user: guide, error: guideError } = await User.getOne(campaign.guideName);
      if (guideError || !guide) return;

      const { result: payments } = await paymentHistory.findByCondition(
        { sponsor: campaign.guideName, type: PAYMENT_HISTORIES_TYPES.TRANSFER },
      );
      const transfers = _.filter(payments,
        (payment) => payment.type === PAYMENT_HISTORIES_TYPES.TRANSFER);
      const totalPayedVote = _.sumBy(payments, 'details.votesAmount');
      let totalPayed = _.sumBy(transfers, 'amount');
      if (totalPayedVote) totalPayed += totalPayedVote;
      const liquidHivePercent = totalPayedVote
        ? 100 - Math.round((totalPayedVote / totalPayed) * 100)
        : 100;
      campaign.guide = {
        liquidHivePercent,
        name: campaign.guideName,
        wobjects_weight: guide.wobjects_weight,
        alias: guide.alias,
        totalPayed,
      };

      campaign.assigned = user ? !!_.find(campaign.users,
        (doer) => doer.name === user.name && doer.status === RESERVATION_STATUSES.ASSIGNED) : false;
      campaign.requirement_filters = await this.requirementFilters(campaign, user);

      validCampaigns.push(_.omit(campaign, ['users', 'payments', 'map', 'objects']));
    }
  }));
  return validCampaigns;
};

const getCompletedUsersInSameCampaigns = async (guideName, requiredObject, userName) => {
  const pipeline = [{
    $match: {
      guideName,
      requiredObject,
      status: { $nin: ['pending'] },
      'users.name': userName,
      'users.status': { $in: ['completed', RESERVATION_STATUSES.COMPLETED] },
    },
  }, {
    $addFields: {
      completedUser: {
        $filter: {
          input: '$users',
          as: 'user',
          cond: {
            $and: [{ $eq: ['$$user.name', userName] },
              { $eq: ['$$user.status', RESERVATION_STATUSES.COMPLETED] }],
          },
        },
      },
      assignedUser: {
        $filter: {
          input: '$users',
          as: 'user',
          cond: { $and: [{ $eq: ['$$user.name', userName] }, { $eq: ['$$user.status', RESERVATION_STATUSES.ASSIGNED] }] },
        },
      },
    },
  }, { $group: { _id: null, lastCompleted: { $max: '$completedUser.updatedAt' }, assignedUser: { $last: '$assignedUser.name' } } }, {
    $project: {
      _id: 0,
      lastCompleted: { $arrayElemAt: ['$lastCompleted', 0] },
      assignedUser: { $arrayElemAt: ['$assignedUser', 0] },
    },
  },
  ];
  const { result } = await Campaign.aggregate(pipeline);
  return {
    lastCompleted: _.get(result, '[0].lastCompleted', null),
    assignedUser: !!_.get(result, '[0].assignedUser'),
  };
};

exports.addCampaignsToWobjects = async ({
  name, wobjects, user, appName, simplified = false,
}) => {
  const permlinks = _.map(wobjects, 'author_permlink');

  const { result: campaigns } = await Campaign.findByCondition({ requiredObject: { $in: permlinks }, objects: { $in: permlinks }, status: 'active' });

  switch (name) {
    case 'list':
    case 'hashtag':
    case 'restaurant':
      await Promise.all(wobjects.map(async (wobj, index) => {
        if (simplified) {
          wobj.fields = _.filter(wobj.fields,
            (field) => _.includes(REQUIREDFIELDS_SIMPLIFIED, field.name));
          wobj = _.pick(wobj, ['fields', 'author_permlink', 'map', 'weight', 'status']);
        }
        const { result, error } = await Campaign.findByCondition({ requiredObject: wobj.author_permlink, status: 'active' });
        if (error || !result.length) {
          wobjects[index] = wobj;
          return;
        }
        const eligibleCampaigns = _.filter(result,
          (campaign) => this.campaignValidation(campaign) === true);
        if (eligibleCampaigns.length) {
          wobj.campaigns = {
            min_reward: (_.minBy(eligibleCampaigns, 'reward')).reward,
            max_reward: (_.maxBy(eligibleCampaigns, 'reward')).reward,
          };
        }
        wobjects[index] = wobj;
      }));
      break;
    case 'dish':
      const { app } = await App.getOne({ name: appName });
      await Promise.all(wobjects.map(async (wobj) => {
        const { result, error } = await Campaign.findByCondition({ objects: wobj.author_permlink, status: 'active' });
        if (error || !result.length) return;
        wobj.propositions = await this.campaignFilter(result, user, app);
      }));
      break;
  }
};
