const { cacheAllObjectExperts } = require('utilities/operations/wobject/objectExperts');
const cron = require('cron');

exports.collectWobjExpertsJob = cron.job('0 1 */1 * *', async () => {
  console.log('Collecting wobj experts info');
  console.time('start');
  await cacheAllObjectExperts(5000);
  console.timeEnd('start');
}, null, false, null, null, false);
