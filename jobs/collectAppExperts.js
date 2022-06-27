const experts = require('utilities/operations/app/experts');
const { CronJob } = require('cron');

exports.collectExpertsJob = new CronJob('0 9 */1 * *', async () => {
  console.log('Collecting app experts info');
  await experts.collect({ limit: 50 });
  console.log('Updating task finished');
}, null, false, null, null, false);
