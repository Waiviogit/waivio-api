const redisGetter = require('utilities/redis/redisGetter');
const { CACHE_KEY } = require('constants/common');

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

exports.getBlockNum = async ({ key }) => {
  const { result, error } = await redisGetter.getAsync({ key });
  if (error) return { error };
  return { blockNum: parseInt(result, 10) };
};
