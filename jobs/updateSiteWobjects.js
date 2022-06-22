const { updateSupportedObjectsTask } = require('utilities/helpers/sitesHelper');
const { CronJob } = require('cron');

exports.updateSiteWobjects = new CronJob('30 */1 * * *', async () => {
  await updateSupportedObjectsTask();
}, null, false, null, null, false);
