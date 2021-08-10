const currencyUtil = require('utilities/hiveApi/currencyUtil');
const redisSetter = require('utilities/redis/redisSetter');
const { CACHE_KEY } = require('constants/common');

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
