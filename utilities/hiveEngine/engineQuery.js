const axios = require('axios');
const _ = require('lodash');

module.exports = async ({
  hostUrl = 'https://api2.hive-engine.com/rpc',
  method = 'find',
  params,
  endpoint = '/contracts',
  id = 'ssc-mainnet-hive',
}) => {
  try {
    const instance = axios.create();
    const resp = await instance.post(
      `${hostUrl}${endpoint}`,
      {
        jsonrpc: '2.0',
        method,
        params,
        id,
      },
    );
    return _.get(resp, 'data.result');
  } catch (error) {
    return { error };
  }
};
