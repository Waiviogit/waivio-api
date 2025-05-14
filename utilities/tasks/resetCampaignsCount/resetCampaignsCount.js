const _ = require('lodash');
const { CampaignV2, WObject } = require('../../../database').models;

const resetCampaignsCount = async () => {
  try {
    console.log('reset activeCampaignsCount');
    await WObject.updateMany({
      activeCampaignsCount: { $gt: 0 },
    }, {
      $set: { activeCampaignsCount: 0, activeCampaigns: [] },
    });
    console.log('reset done');

    const campaigns = CampaignV2.find({ status: 'active' });

    for await (const campaign of campaigns) {
      const { requiredObject, objects } = campaign;
      const objectLinks = _.uniq([requiredObject, ...objects]);
      await WObject.updateMany({
        author_permlink: { $in: objectLinks },
      }, { $inc: { activeCampaignsCount: 1 }, $addToSet: { activeCampaigns: campaign._id } });
    }
    console.log('Task Finished');
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = resetCampaignsCount;
