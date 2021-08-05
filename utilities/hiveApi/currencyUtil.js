const { NODE_URLS } = require('constants/requestData');
const { Client } = require('@hiveio/dhive');

exports.getRewardFund = async () => {
  try {
    const client = new Client(NODE_URLS);
    return {
      result: await client.call('condenser_api', 'get_reward_fund', ['post']),
    };
  } catch (error) {
    return { error };
  }
};

exports.getCurrentMedianHistoryPrice = async () => {
  try {
    const client = new Client(NODE_URLS);
    return {
      result: await client.call('condenser_api', 'get_current_median_history_price', []),
    };
  } catch (error) {
    return { error };
  }
};

