const axios = require('axios');
const { KEY_CHAIN_URL, PRODUCTION_REQUEST_NODES } = require('constants/requestData');

exports.getDelegators = async (account) => {
  try {
    const result = await axios.get(`${KEY_CHAIN_URL.DELEGATORS}${account}`);
    if (!result) return { error: { status: 404, message: 'Not Found' } };
    return { delegatorsResult: result.data };
  } catch (error) {
    return { delegatorsError: error };
  }
};

exports.getDelegations = async (account) => {
  try {
    const result = await axios.post(PRODUCTION_REQUEST_NODES[0], {
      id: 4,
      jsonrpc: '2.0',
      method: 'database_api.find_vesting_delegations',
      params: { account },
    });
    if (!result) return { error: { status: 404, message: 'Not Found' } };
    return { delegationsResult: result.data };
  } catch (error) {
    return { delegationsError: error };
  }
};
