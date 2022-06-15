const { cacheAllWobjectExperts } = require('utilities/helpers/cacheAllWobjectExperts');
const cron = require('cron');

exports.collectWobjExpertsJob = cron.job('30 9 */1 * *', async () => {
  console.time('Collecting wobj experts info');
  await cacheAllWobjectExperts(400);
  console.timeEnd('Collecting wobj experts info');
}, null, false, null, null, false);
