const moment = require('moment');
const _ = require('lodash');
const { User, Wobj, paymentHistory } = require('models');

const campaignValidation = (campaign) => !!(campaign.reservation_timetable[moment().format('dddd').toLowerCase()]
    && _.floor(campaign.budget / campaign.reward) > _.filter(campaign.users, (user) => user.status === 'assigned'
        && user.createdAt > moment().startOf('month')).length);

const requirementFilters = async (campaign, user) => {
  let frequency = [], notBlacklisted = true;
  if (user && user.name) {
    notBlacklisted = !_.includes(campaign.blacklist_users, user.name);
    frequency = _
      .chain(campaign.users)
      .filter((doer) => doer.name === user.name && doer.status === 'completed')
      .orderBy(['updatedAt'], ['desc'])
      .compact()
      .value();
  }
  return {
    can_assign_by_current_day: true,
    can_assign_by_budget: campaign.budget > campaign.reward * _.filter(campaign.users, (doer) => doer.status === 'assigned').length,
    posts: user ? user.count_posts >= campaign.userRequirements.minPosts : false,
    followers: user ? user.count_posts >= campaign.userRequirements.minPosts : false,
    expertise: user ? user.wobjects_weight >= campaign.userRequirements.minExpertise : false,
    freeReservation: true,
    frequency: frequency.length ? moment().startOf('month') > frequency[0].updatedAt : true,
    not_blacklisted: notBlacklisted,
  };
};

exports.campaignFilter = async (campaigns, user) => {
  const validCampaigns = [];
  await Promise.all(campaigns.map(async (campaign) => {
    if (campaignValidation(campaign)) {
      const { result, error } = await Wobj.findOne(campaign.requiredObject);
      if (error) return;
      campaign.required_object = result;
      const { user: guide, error: guideError } = await User.getOne(campaign.guideName);
      if (guideError || !guide) return;

      const { result: totalPayed } = await paymentHistory.findByCondition(
        { sponsor: campaign.guideName, type: 'transfer' },
      );
      campaign.assigned = user ? !!_.find(campaign.users, (doer) => doer.name === user.name && doer.status === 'assigned') : false;
      campaign.requirement_filters = await requirementFilters(campaign, user);
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
