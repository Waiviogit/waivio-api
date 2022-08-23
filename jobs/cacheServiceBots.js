const { CronJob } = require('cron');
const { App } = require('models');
const config = require('config');
const redisSetter = require('utilities/redis/redisSetter');
const _ = require('lodash');
const { processedPostClient } = require('utilities/redis/redis');
const { REDIS_KEYS } = require('constants/common');

const cacheHiveServiceBots = async () => {
  const { app, error } = await App.getOne({ host: config.appHost, bots: true });
  if (error) return;
  if (!app) return;
  await redisSetter.saddAsync({
    key: REDIS_KEYS.CACHE_SERVICE_BOTS,
    values: _.map(app.service_bots, (bot) => JSON.stringify(bot)),
    client: processedPostClient,
  });
};

exports.cacheHiveServiceBotsJob = new CronJob('30 14 */1 * *', async () => {
  await cacheHiveServiceBots();
}, null, false, null, null, false);
