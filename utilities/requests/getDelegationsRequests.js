const axios = require('axios');
const { KEY_CHAIN_URL } = require('../../constants/requestData');
const _ = require('lodash');
const { REQUEST_TIMEOUT } = require('../../constants/common');

exports.getDelegators = async (account, cb = (el) => _.get(el, 'data')) => {
  try {
    const result = await axios.get(
      `${KEY_CHAIN_URL.DELEGATORS}${account}`,
      { timeout: REQUEST_TIMEOUT },
    );
    if (!result && !result.data) return { error: { status: 404, message: 'Not Found' } };
    return cb(result);
  } catch (error) {
    return { error };
  }
};
