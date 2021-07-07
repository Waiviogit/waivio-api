const { CronJob } = require('cron');
const { setMaxWobjWeight } = require('utilities/redis/redisSetter');

exports.updateMaxWobjectWeight = new CronJob('0 0 1/1 * *', async () => {
  // update 'max_wobject_weight' every day
  await setMaxWobjWeight();
  console.log('Updated \'max_wobject_weight\' feed cache finished!');
}, null, false, null, null, true);
