const { importUsersTask } = require('utilities/operations/user/importSteemUserBalancer');
const { redisGetter } = require('utilities/redis');
const cron = require('cron');

exports.importUsersJob = cron.job('0 */1 * * *', async () => {
  console.log('Check for exist users to import from node');
  await importUsersTask(redisGetter.getAllImportedUsers, redisGetter.getImportedUser);
}, null, false, null, null, false);

exports.importErroredUsersJob = cron.job('0 */10 * * *', async () => {
  console.log('Check for exist errored users to import from node');
  await importUsersTask(redisGetter.getAllErroredUsers, redisGetter.getErroredUser);
}, null, false, null, null, false);
