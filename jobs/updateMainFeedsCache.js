const { CronJob } = require('cron');
const { updateCacheOps } = require('utilities/operations/post/feedCache');


exports.updateHotTrendCache = new CronJob('0 */30 * * * *', async () => {
  // update HOT/TREND feed cache every 30 minutes
  await updateCacheOps.updateFeedsCache();
  console.log('Updating HOT/TREND feed cache finished!');
}, null, true, null, null, true);
