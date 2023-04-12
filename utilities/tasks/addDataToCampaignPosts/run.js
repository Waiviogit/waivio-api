const addDataCampaignPosts = require('./addDataCampaignPosts');

(async () => {
  await addDataCampaignPosts();
  process.exit();
})();
