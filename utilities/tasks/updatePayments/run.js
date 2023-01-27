const updateCampaignsCommission = require('./updateCampaignsCommission');

(async () => {
  await updateCampaignsCommission();
  process.exit();
})();
