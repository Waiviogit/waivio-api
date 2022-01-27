const axios = require('axios');
const { KEY_CHAIN_URL } = require('constants/requestData');

exports.getDelegators = async (account) => {
  try {
    const result = await axios.get(`${KEY_CHAIN_URL.DELEGATORS}${account}`);
    if (!result) return { error: { status: 404, message: 'Not Found' } };
    return { delegatorsResult: result.data };
  } catch (error) {
    return { delegatorsError: error };
  }
};
