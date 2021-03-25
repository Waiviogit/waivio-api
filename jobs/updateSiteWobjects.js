const { updateSupportedObjectsTask } = require('utilities/helpers/sitesHelper');
const cron = require('cron');

exports.updateSiteWobjects = cron.job('* 17 */1 * *', async () => {
  await updateSupportedObjectsTask();
}, null, false, null, null, false);
