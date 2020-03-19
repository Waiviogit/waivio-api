const { CronJob } = require('cron');
const { userFollowingsUpdates } = require('utilities/helpers');

exports.userFollowingsJob = new CronJob('0 * * * *', async () => {
  console.log('Start updating last posts counts!');
  await userFollowingsUpdates.refreshUsersCounts();
  await userFollowingsUpdates.refreshWobjectsCounts();
}, null, true, null, null, false);
