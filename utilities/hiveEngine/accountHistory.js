const axios = require('axios');
const { REQUEST_TIMEOUT } = require('../../constants/common');

exports.accountHistory = async (params) => {
  try {
    return {
      response: await axios.get(
        'https://history.hive-engine.com/accountHistory',
        {
          params,
          timeout: REQUEST_TIMEOUT,
        },
      ),
    };
  } catch (error) {
    return { error };
  }
};
