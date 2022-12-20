const { CampaignPosts, CampaignV2 } = require('models');
const _ = require('lodash');

module.exports = async () => {
  const { result } = await CampaignPosts.find({});
  for (const resultElement of result) {
    const { result: campaign } = await CampaignV2.findOne(
      {
        filter: {
          users: {
            $elemMatch: {
              name: resultElement.author, reviewPermlink: resultElement.permlink,
            },
          },
        },
        projection: { 'users.$': 1 },
      },
    );
    if (!campaign) {
      console.log(`Post skipped ${resultElement.author} ${resultElement.permlink}`);
      continue;
    }
    const payoutTokenRateUSD = _.get(campaign, 'users[0].payoutTokenRateUSD');
    await CampaignPosts.updateOne({
      filter: { _id: resultElement._id }, update: { payoutTokenRateUSD },
    });
  }
  console.log('Task Finished');
};
