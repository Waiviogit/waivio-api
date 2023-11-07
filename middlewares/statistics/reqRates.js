const redisSetter = require('utilities/redis/redisSetter');
const { importUserClient } = require('utilities/redis/redis');
const {
  REDIS_KEYS,
  TTL_TIME,
} = require('../../constants/common');

const reqRates = async (req, res, next) => {
  const currentMinute = new Date().getMinutes();

  const key = `${REDIS_KEYS.REQUESTS_RATE}${currentMinute}`;

  await redisSetter.incr({ key, client: importUserClient });
  await redisSetter.expire({ key, client: importUserClient, ttl: TTL_TIME.THIRTY_MINUTES });
  next();
};

module.exports = reqRates;
