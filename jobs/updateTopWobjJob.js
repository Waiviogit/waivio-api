const { CronJob } = require('cron');
const { updateTopWobjects } = require('utilities/operations/objectType');

exports.topWobjJob = new CronJob('0 */30 * * * *', async () => {
  // update TOP wobjects for each ObjectType every 30 minutes
  await updateTopWobjects.updateObjectTypes();
  console.log('Updating top wobjects by ObjectType finished!');
}, null, true, null, null, false);
