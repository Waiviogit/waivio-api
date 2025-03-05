const redisSetter = require('../../utilities/redis/redisSetter');
const { importUserClient } = require('../../utilities/redis/redis');
const {
  REDIS_KEYS,
  TTL_TIME,
} = require('../../constants/common');
const { getCurrentDateString } = require('../../utilities/helpers/dateHelper');

const incrRate = async (req, res, next) => {
  const currentMinute = new Date().getMinutes();

  const key = `${REDIS_KEYS.REQUESTS_RATE}${currentMinute}`;

  await redisSetter.incr({ key, client: importUserClient });
  await redisSetter.expire({ key, client: importUserClient, ttl: TTL_TIME.THIRTY_MINUTES });
  next();
};

const reqTimeMonitor = async (req, res, next) => {
  const start = Date.now();

  const member = req?.route?.path;

  await redisSetter.zincrby({
    key: `${REDIS_KEYS.REQUESTS_BY_URL}:${getCurrentDateString()}`,
    client: importUserClient,
    member,
    increment: 1,
  });
  await redisSetter.expire({
    key: `${REDIS_KEYS.REQUESTS_BY_URL}:${getCurrentDateString()}`,
    client: importUserClient,
    ttl: TTL_TIME.THIRTY_DAYS,
  });

  res.on('finish', async () => {
    const duration = Date.now() - start;

    await redisSetter.zincrby({
      key: `${REDIS_KEYS.REQUESTS_TIME}:${getCurrentDateString()}`,
      client: importUserClient,
      member,
      increment: duration,
    });
    await redisSetter.expire({
      key: `${REDIS_KEYS.REQUESTS_TIME}:${getCurrentDateString()}`,
      client: importUserClient,
      ttl: TTL_TIME.THIRTY_DAYS,
    });
  });

  next();
};

module.exports = {
  incrRate,
  reqTimeMonitor,
};
