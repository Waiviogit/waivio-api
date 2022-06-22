const cacheHelper = require('utilities/helpers/cacheHelper');
const { CronJob } = require('cron');

exports.cacheHivePrice = new CronJob('*/1 * * * *', async () => {
  await cacheHelper.cacheRewardFund();
  await cacheHelper.cacheCurrentMedianHistoryPrice();
}, null, false, null, null, true);
