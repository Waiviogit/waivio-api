const experts = require('utilities/operations/app/experts');
const cron = require('cron');

exports.iaExpertsJob = cron.job('0 0 */1 * *', async () => {
  console.log('Collecting investarena app experts info');
  const { result, error } = await experts.collect({ name: 'investarena', limit: 50, skip: 0 });
  if (error) console.error('Collecting IA experts failed with error: ', error);
  console.log('Updating task finished with flag: ', result);
}, null, false, null, null, false);
