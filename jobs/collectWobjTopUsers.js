const { cacheAllWobjectExperts } = require('utilities/helpers/cacheAllWobjectExperts');
const cron = require('cron');

exports.collectWobjExpertsJob = cron.job('0 1 */1 * *', async () => {
  console.time('Collecting wobj experts info');
  await cacheAllWobjectExperts(400);
  console.timeEnd('Collecting wobj experts info');
}, null, false, null, null, false);
