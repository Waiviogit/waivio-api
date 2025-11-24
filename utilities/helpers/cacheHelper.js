const crypto = require('node:crypto');
const currencyUtil = require('../hiveApi/currencyUtil');
const redisSetter = require('../redis/redisSetter');
const { CACHE_KEY } = require('../../constants/common');
const {
  redisGetter,
  redis,
} = require('../redis');
const jsonHelper = require('./jsonHelper');

const inFlightRefreshes = new Map();

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
      stack: err.stack,
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
      stack: err.stack,
    });
    // If cache operations fail completely, fall back to calling the function directly
    return await fn(...args);
  }
};

const refreshCacheValue = async ({
  key,
  fetcher,
  persistSeconds,
}) => {
  try {
    const fresh = await fetcher();
    if (!fresh?.error) {
      await setCachedData({
        key,
        data: {
          payload: fresh,
          cachedAt: Date.now(),
        },
        ttl: persistSeconds,
      });
    }
  } catch (err) {
    console.error('staleWhileRevalidate refresh error:', err.message);
  } finally {
    inFlightRefreshes.delete(key);
  }
};

const triggerBackgroundRefresh = ({
  key,
  fetcher,
  persistSeconds,
}) => {
  if (inFlightRefreshes.has(key)) return;
  const refreshPromise = refreshCacheValue({ key, fetcher, persistSeconds });
  inFlightRefreshes.set(key, refreshPromise);
};

const staleWhileRevalidate = async ({
  key,
  ttlSeconds,
  fetcher,
  persistSeconds,
}) => {
  const now = Date.now();
  const cacheRaw = await getCachedData(key);
  const effectivePersistSeconds = Math.max(persistSeconds || ttlSeconds * 2, ttlSeconds);

  if (cacheRaw) {
    const parsed = jsonHelper.parseJson(cacheRaw, null);
    if (parsed) {
      const payload = Object.prototype.hasOwnProperty.call(parsed, 'payload')
        ? parsed.payload
        : parsed;
      const cachedAt = parsed?.cachedAt || 0;
      const isStale = cachedAt
        ? (now - cachedAt) >= (ttlSeconds * 1000)
        : false;

      if (isStale) {
        triggerBackgroundRefresh({
          key,
          fetcher,
          persistSeconds: effectivePersistSeconds,
        });
      }

      if (payload !== undefined) return payload;
    }
  }

  const result = await fetcher();
  if (!result?.error) {
    try {
      await setCachedData({
        key,
        data: {
          payload: result,
          cachedAt: now,
        },
        ttl: effectivePersistSeconds,
      });
      return result;
    } catch (err) {
      console.error('staleWhileRevalidate set cache error:', err.message);
      return result;
    }
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
  staleWhileRevalidate,
};
