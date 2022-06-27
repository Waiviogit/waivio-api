const { getClient } = require('utilities/hiveApi/clientOptions');
const { REDIS_KEYS } = require('constants/common');

exports.getRewardFund = async () => {
  try {
    const client = await getClient(REDIS_KEYS.TEST_LOAD.POST);
    return {
      result: await client.call('condenser_api', 'get_reward_fund', ['post']),
    };
  } catch (error) {
    return { error };
  }
};

exports.getCurrentMedianHistoryPrice = async () => {
  try {
    const client = await getClient(REDIS_KEYS.TEST_LOAD.POST);
    return {
      result: await client.call('condenser_api', 'get_current_median_history_price', []),
    };
  } catch (error) {
    return { error };
  }
};
