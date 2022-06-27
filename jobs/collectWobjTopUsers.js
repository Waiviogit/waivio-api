const { cacheAllWobjectExperts } = require('utilities/helpers/cacheAllWobjectExperts');
const { CronJob } = require('cron');

exports.collectWobjExpertsJob = new CronJob('30 9 */1 * *', async () => {
  console.time('Collecting wobj experts info');
  await cacheAllWobjectExperts(400);
  console.timeEnd('Collecting wobj experts info');
}, null, false, null, null, false);
