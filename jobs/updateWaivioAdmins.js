const { CronJob } = require('cron');
const { getWaivioAdminsAndOwner } = require('../utilities/helpers/getWaivioAdminsAndOwnerHelper');

exports.updateWaivioAdmins = new CronJob('0 */2 * * *', async () => {
  await getWaivioAdminsAndOwner(true);
});
