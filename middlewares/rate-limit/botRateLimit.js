const redisSetter = require('utilities/redis/redisSetter');
const redisGetter = require('utilities/redis/redisGetter');
const { isbot } = require('isbot');
const {
  REDIS_KEYS,
  TTL_TIME,
} = require('../../constants/common');
const { getIpFromHeaders } = require('../../utilities/helpers/sitesHelper');

const { SERVER_IP } = process.env;
const { NODE_ENV } = process.env;

const DAILY_LIMIT = 500;

const botRateLimit = async (req, res, next) => {
  if (NODE_ENV === 'production') return next();

  const userAgent = req.get('User-Agent');
  const bot = isbot(userAgent);
  const ip = getIpFromHeaders(req);
  if (!bot) return next();

  // staging remove all bots except frontend
  if (ip !== SERVER_IP && NODE_ENV === 'staging') {
    return res.status(429).send('Requests limit exceeded');
  }

  if (ip === SERVER_IP) return next();

  const key = `${REDIS_KEYS.API_RATE_LIMIT_COUNTER}:${userAgent}`;
  const { result: limitCounter = 0 } = await redisGetter
    .getAsync({ key });
  const { result: limit = DAILY_LIMIT } = await redisGetter
    .getAsync({ key: REDIS_KEYS.API_RATE_LIMIT_BOTS });

  if (+limitCounter >= +limit) {
    return res.status(429).send('Requests limit exceeded');
  }

  await redisSetter.incrExpire({
    key, ttl: TTL_TIME.ONE_DAY,
  });

  next();
};

module.exports = botRateLimit;
