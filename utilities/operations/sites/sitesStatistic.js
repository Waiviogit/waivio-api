const { isbot } = require('isbot');
const {
  REDIS_KEYS,
  TTL_TIME,
} = require('../../../constants/common');
const { getCurrentDateString } = require('../../helpers/dateHelper');
const { redisSetter, redis } = require('../../redis');
const { redisStatisticsKey } = require('../../../constants/sitesConstants');

const setSiteActiveUser = async ({ userAgent, host, ip }) => {
  const bot = isbot(userAgent);
  const key = `${REDIS_KEYS.API_VISIT_STATISTIC}:${getCurrentDateString()}:${host}:${bot ? 'bot' : 'user'}`;

  await redisSetter.zincrbyExpire({
    key, ttl: TTL_TIME.THIRTY_DAYS, member: ip, increment: 1,
  });

  if (bot) return;
  await redisSetter.addSiteActiveUser(`${redisStatisticsKey}:${host}`, ip);
};

const setSiteAction = async ({ userAgent, host, ip }) => {
  const bot = isbot(userAgent);
  if (bot) return { result: false };

  await redisSetter.saddAsync({
    key: `${REDIS_KEYS.SITES_ACTION_UNIQ}:${host}`,
    values: ip,
    client: redis.appUsersStatistics,
  });

  await redisSetter.incr({
    key: `${REDIS_KEYS.SITES_ACTION_TOTAL}:${host}`,
    client: redis.appUsersStatistics,
  });

  return { result: true };
};



module.exports = {
  setSiteActiveUser,
  setSiteAction,
};
