const axios = require('axios');

exports.accountHistory = async (params) => {
  try {
    return { response: await axios.get('https://accounts.hive-engine.com/accountHistory', { params }) };
  } catch (error) {
    return { error };
  }
};
