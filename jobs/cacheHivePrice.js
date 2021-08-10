const cacheHelper = require('utilities/helpers/cacheHelper');
const cron = require('cron');

exports.cacheHivePrice = cron.job('*/1 * * * *', async () => {
  await cacheHelper.cacheRewardFund();
  await cacheHelper.cacheCurrentMedianHistoryPrice();
}, null, false, null, null, true);
