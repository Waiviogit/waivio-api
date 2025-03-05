const axios = require('axios');
const { CURRENCIES_API } = require('../../constants/requestData');
const redisGetter = require('../redis/redisGetter');
const cacheHelper = require('../helpers/cacheHelper');
const { REQUEST_TIMEOUT, TTL_TIME, REDIS_KEYS } = require('../../constants/common');

exports.getCurrencyLatestRate = async (params) => {
  try {
    const result = await axios.get(
      `${CURRENCIES_API.HOST}${CURRENCIES_API.BASE_URL}${CURRENCIES_API.RATE}${CURRENCIES_API.LATEST}`,
      {
        params,
        timeout: REQUEST_TIMEOUT,
      },
    );
    if (!result) return { error: { status: 404, message: 'Not Found' } };
    return { result: result.data };
  } catch (error) {
    return { error };
  }
};

exports.getEngineRate = async (params = { token: 'WAIV' }) => {
  try {
    const key = `${REDIS_KEYS.ENGINE_RATE}:${params.token}`;
    const cache = await redisGetter.getFromCache({ key });
    if (cache) return { result: cache };
    const result = await axios.get(
      `${CURRENCIES_API.HOST}${CURRENCIES_API.BASE_URL}${CURRENCIES_API.ENGINE_CURRENT}`,
      {
        params,
        timeout: REQUEST_TIMEOUT,
      },
    );
    if (!result) return { error: { status: 404, message: 'Not Found' } };

    await cacheHelper.setCachedData({ key, data: result.data, ttl: TTL_TIME.ONE_MINUTE });
    return { result: result.data };
  } catch (error) {
    return { error };
  }
};
