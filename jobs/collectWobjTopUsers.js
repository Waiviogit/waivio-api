const { cacheAllObjectExperts } = require('utilities/operations/wobject/objectExperts');
const cron = require('cron');

exports.collectWobjExpertsJob = cron.job('0 1 */1 * *', async () => {
  console.time('Collecting wobj experts info');
  await cacheAllObjectExperts(500);
  console.timeEnd('Collecting wobj experts info');
}, null, false, null, null, false);
