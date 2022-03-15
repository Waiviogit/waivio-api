const cron = require('cron');
const { getWaivioAdminsAndOwner } = require('../utilities/helpers/getWaivioAdminsAndOwnerHelper');

exports.updateWaivioAdmins = cron.job('0 */2 * * *', async () => {
  await getWaivioAdminsAndOwner(true);
});
