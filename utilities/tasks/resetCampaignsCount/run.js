const resetCampaignsCount = require('./resetCampaignsCount');

(async () => {
  await resetCampaignsCount();
  process.exit();
})();
