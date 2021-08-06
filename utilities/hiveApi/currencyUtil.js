const { currencyClient: client } = require('utilities/hiveApi/hiveClient');

exports.getRewardFund = async () => {
  try {
    return {
      result: await client.call('condenser_api', 'get_reward_fund', ['post']),
    };
  } catch (error) {
    return { error };
  }
};

exports.getCurrentMedianHistoryPrice = async () => {
  try {
    return {
      result: await client.call('condenser_api', 'get_current_median_history_price', []),
    };
  } catch (error) {
    return { error };
  }
};
