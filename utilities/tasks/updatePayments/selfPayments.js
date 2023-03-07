const { CampaignPayments } = require('database').models;

module.exports = async () => {
  try {
    const guides = await CampaignPayments.distinct('guideName');

    for (const guide of guides) {
      const payments = await CampaignPayments.find({ guideName: guide, userName: guide }).lean();
      for (const payment of payments) {
        await CampaignPayments.updateOne(
          { _id: payment._id },
          { type: `${payment.type}Self` },
        );
      }
    }
    console.log('task finished');
  } catch (error) {
    console.error(error.message);
  }
};
