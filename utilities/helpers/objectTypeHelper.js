const moment = require('moment');
const _ = require('lodash');
const {
  User, Wobj, paymentHistory, Campaign,
} = require('models');

exports.campaignValidation = (campaign) => !!(campaign.reservation_timetable[moment().format('dddd').toLowerCase()]
    && _.floor(campaign.budget / campaign.reward) > _.filter(campaign.users, (user) => (user.status === 'assigned' || user.status === 'completed')
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
  const canAssignByBudget = _.floor(campaign.budget / campaign.reward) > _.filter(campaign.users, (usr) => (usr.status === 'assigned' || usr.status === 'completed')
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

exports.campaignFilter = async (campaigns, user) => {
  const validCampaigns = [];
  await Promise.all(campaigns.map(async (campaign) => {
    if (this.campaignValidation(campaign)) {
      const { result, error } = await Wobj.findOne(campaign.requiredObject);
      if (error) return;
      campaign.required_object = result;
      const { user: guide, error: guideError } = await User.getOne(campaign.guideName);
      if (guideError || !guide) return;

      const { result: totalPayed } = await paymentHistory.findByCondition(
        { sponsor: campaign.guideName, type: 'transfer' },
      );
      campaign.assigned = user ? !!_.find(campaign.users, (doer) => doer.name === user.name && doer.status === 'assigned') : false;
      campaign.requirement_filters = await this.requirementFilters(campaign, user);
      campaign.guide = {
        name: campaign.guideName,
        wobjects_weight: guide.wobjects_weight,
        alias: guide.alias,
        totalPayed: _.sumBy(totalPayed, (count) => count.amount),
      };
      validCampaigns.push(campaign);
    }
  }));
  return validCampaigns;
};

const getCompletedUsersInSameCampaigns = async (guideName, requiredObject, userName) => {
  const pipeline = [{
    $match: {
      guideName, requiredObject, status: { $nin: ['pending'] }, 'users.name': userName, 'users.status': { $in: ['completed', 'assigned'] },
    },
  }, {
    $addFields: {
      completedUser: {
        $filter: { input: '$users', as: 'user', cond: { $and: [{ $eq: ['$$user.name', userName] }, { $eq: ['$$user.status', 'completed'] }] } },
      },
      assignedUser: { $filter: { input: '$users', as: 'user', cond: { $and: [{ $eq: ['$$user.name', userName] }, { $eq: ['$$user.status', 'assigned'] }] } } },
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
  return { lastCompleted: _.get(result, '[0].lastCompleted', null), assignedUser: !!_.get(result, '[0].assignedUser') };
};
