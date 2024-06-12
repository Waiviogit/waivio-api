const { getRegularClient } = require('./clientOptions');

exports.getRewardFund = async () => {
  try {
    const client = await getRegularClient();
    return {
      result: await client.call('condenser_api', 'get_reward_fund', ['post']),
    };
  } catch (error) {
    return { error };
  }
};

exports.getCurrentMedianHistoryPrice = async () => {
  try {
    const client = await getRegularClient();
    return {
      result: await client.call('condenser_api', 'get_current_median_history_price', []),
    };
  } catch (error) {
    return { error };
  }
};

exports.getDynamicGlobalProperties = async () => {
  try {
    const client = await getRegularClient();
    return {
      result: await client.call('condenser_api', 'get_dynamic_global_properties', []),
    };
  } catch (error) {
    return { error };
  }
};
