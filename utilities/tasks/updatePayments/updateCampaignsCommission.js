const { CAMPAIGN_PAYMENT } = require('constants/campaignsV2');
const { CampaignPayments } = require('database').models;
const BigNumber = require('bignumber.js');

module.exports = async () => {
  try {
    const payments = await CampaignPayments.find({ type: CAMPAIGN_PAYMENT.CAMPAIGNS_SERVER_FEE }).lean();
    for (const payment of payments) {
      await CampaignPayments.updateOne(
        { _id: payment._id },
        { commission: BigNumber(payment.commission).times(10) },
      );
    }
  } catch (error) {
    console.error(error.message);
  }
};
