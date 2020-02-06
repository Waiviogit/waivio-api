const moment = require('moment');
const _ = require('lodash');
const { User, Wobj, paymentHistory } = require('models');


exports.campaignFilter = async (campaigns) => {
  const validCampaigns = [];
  await Promise.all(campaigns.map(async (campaign) => {
    if (campaignValidation(campaign)) {
      const { result, error } = await Wobj.findOne(campaign.requiredObject);
      if (error) return;
      campaign.required_object = result;
      const { user, error: userError } = await User.getOne(campaign.guideName);
      if (userError || !user) return;

      const { result: totalPayed } = await paymentHistory.findByCondition(
        { sponsor: campaign.guideName, type: 'transfer' },
      );
      campaign.guide = {
        name: campaign.guideName,
        wobjects_weight: user.wobjects_weight,
        alias: user.alias,
        totalPayed: _.sumBy(totalPayed, (count) => count.amount),
      };
      validCampaigns.push(campaign);
    }
  }));
  return validCampaigns;
};

const campaignValidation = (campaign) => !!(campaign.reservation_timetable[moment().format('dddd').toLowerCase()]
      && _.floor(campaign.budget / campaign.reward) > _.filter(campaign.users, (user) => user.status === 'assigned'
          && user.createdAt > moment().startOf('month')).length);
