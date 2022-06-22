const experts = require('utilities/operations/app/experts');
const { CronJob } = require('cron');

exports.collectExpertsJob = new CronJob('0 9 */1 * *', async () => {
  console.log('Collecting app experts info');
  const result = await experts.collect({ limit: 50 });
  console.log('Updating task finished with apps status: ', result);
}, null, false, null, null, false);
