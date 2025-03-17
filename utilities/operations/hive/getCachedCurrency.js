const redisGetter = require('../../redis/redisGetter');
const { CACHE_KEY } = require('../../../constants/common');
const { getDynamicGlobalProperties } = require('../../hiveApi/currencyUtil');
const {
  REDIS_KEYS,
  TTL_TIME,
} = require('../../../constants/common');
const {
  getCachedData,
  setCachedData,
} = require('../../helpers/cacheHelper');
const jsonHelper = require('../../helpers/jsonHelper');

exports.getRewardFund = async () => {
  const { result, error } = await redisGetter.getHashAll({ key: CACHE_KEY.REWARD_FUND });
  if (error) return { error };
  return { result };
};

exports.getCurrentMedianHistory = async () => {
  const { result, error } = await redisGetter
    .getHashAll({ key: CACHE_KEY.CURRENT_MEDIAN_HISTORY_PRICE });
  if (error) return { error };
  return { result };
};

exports.getGlobalProperties = async () => {
  const key = `${REDIS_KEYS.API_RES_CACHE}:${REDIS_KEYS.DYNAMIC_GLOBAL_PROPERTIES}`;
  const cache = await getCachedData(key);
  if (cache) return jsonHelper.parseJson(cache, {});

  const { result, error } = await getDynamicGlobalProperties();

  if (error) return { error };

  await setCachedData({
    key, data: { result }, ttl: TTL_TIME.THIRTY_MINUTES,
  });
  return { result };
};

exports.getBlockNum = async ({ key }) => {
  const { result, error } = await redisGetter.getAsync({ key });
  if (error) return { error };
  return { blockNum: parseInt(result, 10) };
};
