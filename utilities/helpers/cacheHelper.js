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
  try {
    const { result: resp } = await redisGetter.getAsync({
      key,
      client: redis.mainFeedsCacheClient,
    });

    return resp;
  } catch (err) {
    console.error('getCachedData error:', err.message);
    return null; // Return null if cache read fails
  }
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
  try {
    await redisSetter.setEx({
      key, value: JSON.stringify(data), ttl,
    });
  } catch (err) {
    console.error('setCachedData error:', err.message);
    throw err; // Re-throw so caller can handle
  }
};

const cacheWrapper = (fn) => (...args) => async ({ key, ttl }) => {
  try {
    const cache = await getCachedData(key);
    if (cache) {
      const parsed = jsonHelper.parseJson(cache, null);
      if (parsed) return parsed;
    }
    const result = await fn(...args);

    if (!result?.error) {
      try {
        await setCachedData({ key, data: result, ttl });
      } catch (setCacheError) {
        console.error('Cache set error (non-critical):', setCacheError.message);
        // Don't fail the request if cache set fails
      }
    }
    return result;
  } catch (err) {
    console.error('cacheWrapper: Critical error, falling back to direct function call:', {
      message: err.message,
      stack: err.stack
    });
    // If cache operations fail completely, fall back to calling the function directly
    return await fn(...args);
  }
};

const cacheWrapperWithTTLRefresh = (fn) => (...args) => async ({ key, ttl }) => {
  try {
    const cache = await getCachedData(key);
    if (cache) {
      const parsed = jsonHelper.parseJson(cache, null);
      if (parsed) {
        // console.log('FROM CACHE'); // Commented out to reduce log noise
        try {
          await redisSetter.expire({ key, ttl });
        } catch (expireError) {
          console.error('Cache expire error (non-critical):', expireError.message);
          // Don't fail the request if expire fails, just log it
        }
        return parsed;
      }
    }
    const result = await fn(...args);

    if (!result?.error) {
      try {
        await setCachedData({ key, data: result, ttl });
      } catch (setCacheError) {
        console.error('Cache set error (non-critical):', setCacheError.message);
        // Don't fail the request if cache set fails
      }
    }
    return result;
  } catch (err) {
    console.error('cacheWrapperWithTTLRefresh: Critical error, falling back to direct function call:', {
      message: err.message,
      stack: err.stack
    });
    // If cache operations fail completely, fall back to calling the function directly
    return await fn(...args);
  }
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
