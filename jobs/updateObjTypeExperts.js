const { CronJob } = require('cron');
const { updateTopExperts } = require('utilities/operations/objectType');

exports.objTypeExpertsJob = new CronJob('0 0  */12 * * *', async () => {
  // update TOP experts for each ObjectType every 12 hours
  await updateTopExperts.updateObjectTypeExperts();
}, null, true, null, null, false);
