const { CURRENCIES_API } = require('constants/requestData');
const redisGetter = require('utilities/redis/redisGetter');
const redisSetter = require('utilities/redis/redisSetter');
const axios = require('axios');
const { REQUEST_TIMEOUT } = require('../../constants/common');

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
    const key = `engine_rate:${params.token}`;
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
    await redisSetter.addToCache({ key, data: result.data });
    return { result: result.data };
  } catch (error) {
    return { error };
  }
};
