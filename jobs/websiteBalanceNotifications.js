const { sitesNotifications } = require('utilities/operations/sites');
const { CronJob } = require('cron');

exports.sendBalanceNotification = new CronJob('7 0 */1 * *', async () => {
  console.log('Start send website balance notifications');
  await sitesNotifications.balanceNotification();
}, null, false, null, null, false);
