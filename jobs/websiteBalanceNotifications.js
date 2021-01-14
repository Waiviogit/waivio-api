const { sitesNotifications } = require('utilities/operations/sites');
const cron = require('cron');

exports.sendBalanceNotification = cron.job('7 0 */1 * *', async () => {
  console.log('Start send website balance notifications');
  await sitesNotifications.balanceNotification();
}, null, false, null, null, false);
