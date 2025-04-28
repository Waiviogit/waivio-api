const crypto = require('node:crypto');
const currencyUtil = require('../hiveApi/currencyUtil');
const redisSetter = require('../redis/redisSetter');
const { CACHE_KEY } = require('../../constants/common');
const {
  redisGetter,
  redis,
} = require('../redis');
const jsonHelper = require('./jsonHelper');

const cacheRewardFund = async () => {
  const { result, error } = await currencyUtil.getRewardFund();
  if (error) return;
  await redisSetter.hmsetAsync({ key: CACHE_KEY.REWARD_FUND, data: result });
};

const cacheCurrentMedianHistoryPrice = async () => {
  const { result, error } = await currencyUtil.getCurrentMedianHistoryPrice();
  if (error) return;
  await redisSetter.hmsetAsync({ key: CACHE_KEY.CURRENT_MEDIAN_HISTORY_PRICE, data: result });
};

const getCacheKey = (data = {}) => crypto
  .createHash('md5')
  .update(`${JSON.stringify(data)}`, 'utf8')
  .digest('hex');

const getCachedData = async (key) => {
  const { result: resp } = await redisGetter.getAsync({
    key,
    client: redis.mainFeedsCacheClient,
  });

  return resp;
};

const getCache = async (key) => {
  const { result: resp } = await redisGetter.getAsync({
    key,
    client: redis.mainFeedsCacheClient,
  });

  return jsonHelper.parseJson(resp, null);
};

const setCachedData = async ({
  key,
  data,
  ttl,
}) => {
  await redisSetter.setEx({
    key, value: JSON.stringify(data), ttl,
  });
};

const cacheWrapper = (fn) => (...args) => async ({ key, ttl }) => {
  const cache = await getCachedData(key);
  if (cache) {
    const parsed = jsonHelper.parseJson(cache, null);
    if (parsed) return parsed;
  }
  const result = await fn(...args);

  if (!result?.error) {
    await setCachedData({ key, data: result, ttl });
  }
  return result;
};

const cacheWrapperWithTTLRefresh = (fn) => (...args) => async ({ key, ttl }) => {
  const cache = await getCachedData(key);
  if (cache) {
    const parsed = jsonHelper.parseJson(cache, null);
    if (parsed) {
      console.log('FROM CACHE');
      await redisSetter.expire({ key, ttl });
      return parsed;
    }
  }
  const result = await fn(...args);

  if (!result?.error) {
    await setCachedData({ key, data: result, ttl });
  }
  return result;
};

module.exports = {
  setCachedData,
  getCachedData,
  getCacheKey,
  cacheCurrentMedianHistoryPrice,
  cacheRewardFund,
  cacheWrapper,
  cacheWrapperWithTTLRefresh,
  getCache,
};
