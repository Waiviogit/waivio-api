const currencyUtil = require('utilities/hiveApi/currencyUtil');
const redisSetter = require('utilities/redis/redisSetter');
const { CACHE_KEY } = require('constants/common');
const crypto = require('node:crypto');
const {
  redisGetter,
  redis,
} = require('../redis');

exports.cacheRewardFund = async () => {
  const { result, error } = await currencyUtil.getRewardFund();
  if (error) return;
  await redisSetter.hmsetAsync({ key: CACHE_KEY.REWARD_FUND, data: result });
};

exports.cacheCurrentMedianHistoryPrice = async () => {
  const { result, error } = await currencyUtil.getCurrentMedianHistoryPrice();
  if (error) return;
  await redisSetter.hmsetAsync({ key: CACHE_KEY.CURRENT_MEDIAN_HISTORY_PRICE, data: result });
};

exports.getCacheKey = (data = {}) => crypto
  .createHash('md5')
  .update(`${JSON.stringify(data)}`, 'utf8')
  .digest('hex');

exports.getCachedData = async (key) => {
  const { result: resp } = await redisGetter.getAsync({
    key,
    client: redis.mainFeedsCacheClient,
  });

  return resp;
};

exports.setCachedData = async ({
  key,
  data,
  ttl,
}) => {
  await redisSetter.setEx({
    key, value: JSON.stringify(data), ttl,
  });
};
