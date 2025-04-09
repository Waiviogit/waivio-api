const moment = require('moment');
const _ = require('lodash');
const {
  User, Wobj, paymentHistory, Campaign, App,
} = require('../../models');
const { REQUIREDFIELDS_POST, REQUIREDFIELDS_SIMPLIFIED, REMOVE_OBJ_STATUSES } = require('../../constants/wobjectsData');
const { RESERVATION_STATUSES, PAYMENT_HISTORIES_TYPES } = require('../../constants/campaignsData');

const wobjectHelper = require('./wObjectHelper');
const campaignsV2Helper = require('./campaignsV2Helper');
const asyncLocalStorage = require('../../middlewares/context/context');
const { isMobileDevice } = require('../../middlewares/context/contextHelper');

exports.campaignValidation = (campaign) => !!(campaign.reservation_timetable[moment().format('dddd').toLowerCase()]
    && _.floor(campaign.budget / campaign.reward) > _.filter(
      campaign.users,
      (user) => (user.status === 'assigned' || user.status === 'completed')
        && user.createdAt > moment().startOf('month'),
    ).length);

exports.requirementFilters = async (campaign, user) => {
  let frequency = null, notBlacklisted = true, assignedUser, daysPassed;
  if (user && user.name) {
    user.wobjects_weight = user.wobjects_weight < 0 ? 0 : user.wobjects_weight;
    notBlacklisted = !_.includes(campaign.blacklist_users, user.name);
    ({ lastCompleted: frequency, assignedUser } = await getCompletedUsersInSameCampaigns(campaign.guideName, campaign.requiredObject, user.name));
    daysPassed = Math.trunc((new Date().valueOf() - new Date(frequency).valueOf()) / 86400000);
  }
  const canAssignByBudget = _.floor(campaign.budget / campaign.reward) > _.filter(
    campaign.users,
    (usr) => (usr.status === 'assigned' || usr.status === 'completed')
      && usr.createdAt > moment().startOf('month'),
  ).length;

  return {
    can_assign_by_current_day: !!campaign.reservation_timetable[moment().format('dddd').toLowerCase()],
    can_assign_by_budget: canAssignByBudget,
    posts: user ? user.count_posts >= campaign.userRequirements.minPosts : false,
    followers: user ? user.count_posts >= campaign.userRequirements.minPosts : false,
    expertise: user ? user.wobjects_weight >= campaign.userRequirements.minExpertise : false,
    freeReservation: !assignedUser,
    frequency: _.isNumber(daysPassed) ? daysPassed >= campaign.frequency_assign : true,
    not_blacklisted: notBlacklisted,
  };
};

exports.campaignFilter = async (campaigns, user, app) => {
  const validCampaigns = [];
  const { result: wobjects, error } = await Wobj.find(
    { author_permlink: { $in: _.map(campaigns, 'requiredObject') } },
    { search: 0, departments: 0 },
  );
  if (error) return;
  await Promise.all(campaigns.map(async (campaign) => {
    if (this.campaignValidation(campaign)) {
      const result = _.find(wobjects, { author_permlink: campaign.requiredObject });
      if (!result) return;
      campaign.required_object = await wobjectHelper.processWobjects({
        wobjects: [result], app, returnArray: false, fields: REQUIREDFIELDS_POST, mobile: isMobileDevice(),
      });
      const { user: guide, error: guideError } = await User.getOne(campaign.guideName);
      if (guideError || !guide) return;

      const { result: payments } = await paymentHistory.findByCondition(
        { sponsor: campaign.guideName, type: PAYMENT_HISTORIES_TYPES.TRANSFER },
      );
      const transfers = _.filter(
        payments,
        (payment) => payment.type === PAYMENT_HISTORIES_TYPES.TRANSFER,
      );
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

      campaign.assigned = user ? !!_.find(
        campaign.users,
        (doer) => doer.name === user.name && doer.status === RESERVATION_STATUSES.ASSIGNED,
      ) : false;
      campaign.requirement_filters = await this.requirementFilters(campaign, user);

      validCampaigns.push(_.omit(campaign, ['payments', 'map', 'objects']));
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
      'users.status': { $in: [RESERVATION_STATUSES.ASSIGNED, RESERVATION_STATUSES.COMPLETED] },
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
  },
  { $project: { _id: null, completedUser: 1, assignedUser: 1 } },
  ];
  const { result } = await Campaign.aggregate(pipeline);
  if (_.isEmpty(result)) return { lastCompleted: null, assignedUser: false };
  return {
    lastCompleted: _.max(_.map(result[0].completedUser, 'updatedAt')) || null,
    assignedUser: !!_.last(_.get(result, '[0].assignedUser')),
  };
};

exports.addCampaignsToWobjects = async ({
  wobjects, user, simplified = false, app, search,
}) => {
  const permlinks = _.map(wobjects, 'author_permlink');

  if (!app) {
    const store = asyncLocalStorage.getStore();
    const host = store.get('host');
    ({ result: app } = await App.findOne({ host }));
  }

  const { result: campaigns } = await Campaign.findByCondition(
    { $or: [{ objects: { $in: permlinks } }, { requiredObject: { $in: permlinks } }], status: 'active' },
  );

  await Promise.all(wobjects.map(async (wobj, index) => {
    if (_.includes(REMOVE_OBJ_STATUSES, _.get(wobjects[index], 'status.title'))) return;
    if (simplified) {
      wobj.fields = _.filter(
        wobj.fields,
        (field) => _.includes(REQUIREDFIELDS_SIMPLIFIED, field.name),
      );
      wobj = _.pick(wobj, ['fields', 'author_permlink', 'map', 'weight', 'status', 'default_name', 'parent']);
    }
    const primaryCampaigns = _.filter(campaigns, { requiredObject: wobj.author_permlink });
    if (primaryCampaigns.length) {
      const eligibleCampaigns = _.filter(
        primaryCampaigns,
        (campaign) => this.campaignValidation(campaign) === true,
      );
      if (eligibleCampaigns.length) {
        wobj.campaigns = {
          min_reward: (_.minBy(eligibleCampaigns, 'reward')).reward,
          max_reward: (_.maxBy(eligibleCampaigns, 'reward')).reward,
        };
      }
      wobjects[index] = wobj;
      return;
    }
    const secondaryCampaigns = _.filter(
      campaigns,
      (campaign) => _.includes(campaign.objects, wobj.author_permlink),
    );
    if (secondaryCampaigns.length) {
      const propositions = await this.campaignFilter(secondaryCampaigns, user, app);
      wobj.propositions = [_.maxBy(propositions, 'reward')];
    }
    wobjects[index] = wobj;
  }));
  await campaignsV2Helper.addNewCampaignsToObjects({ user, wobjects });
  return wobjects;
};

exports.addCampaignsToWobjectsSites = async (data) => {
  if (data.addHashtag) return data.wobjects;

  const result = await this.addCampaignsToWobjects({ ...data, search: true }) || [];

  if (!_.isEmpty(_.filter(data, (item) => _.has(item, 'campaigns') || _.has(item, 'propositions')))) {
    result.sort((a, b) => {
      if (_.has(b, 'campaigns') && _.has(a, 'campaigns')) {
        return _.get(b, 'campaigns.max_reward', 0) - _.get(a, 'campaigns.max_reward', 0);
      }
      if (_.has(b, 'propositions') && _.has(a, 'propositions')) {
        return _.get(b, 'propositions[0].reward', 0) - _.get(a, 'propositions[0].reward', 0);
      }
      return !!_.get(b, 'campaigns') - !!_.get(a, 'campaigns', _.get(a, 'propositions'));
    });
  }

  return result;
};
