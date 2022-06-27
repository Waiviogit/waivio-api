const { collectSiteDebts } = require('utilities/operations/sites');
const { CronJob } = require('cron');

exports.sendDailyWebsiteDebt = new CronJob('0 0 */1 * *', async () => {
  console.log('Start send website payments');
  await collectSiteDebts.dailySuspendedDebt();
  await collectSiteDebts.dailyDebt();
}, null, false, null, null, false);
