const { NODE_URLS } = require('constants/requestData');
const { Client } = require('@hiveio/dhive');

const client = new Client(NODE_URLS, { failoverThreshold: 0, timeout: 10 * 1000 });

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
