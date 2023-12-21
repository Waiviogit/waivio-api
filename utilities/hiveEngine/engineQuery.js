const axios = require('axios');
const _ = require('lodash');
const { HIVE_ENGINE_NODES } = require('constants/hiveEngine');
const { REQUEST_TIMEOUT } = require('../../constants/common');

exports.engineQuery = async ({
  hostUrl = 'https://engine.waivio.com',
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
      {
        timeout: REQUEST_TIMEOUT,
      },
    );
    return _.get(resp, 'data.result');
  } catch (error) {
    return { error };
  }
};

exports.engineProxy = async ({
  hostUrl,
  method,
  params,
  endpoint,
  id,
  attempts = 5,
}) => {
  const response = await this.engineQuery({
    hostUrl,
    method,
    params,
    endpoint,
    id,
  });
  if (_.has(response, 'error')) {
    if (attempts <= 0) return response;
    return this.engineProxy({
      hostUrl: getNewNodeUrl(hostUrl),
      method,
      params,
      endpoint,
      id,
      attempts: attempts - 1,
    });
  }
  return response;
};

const getNewNodeUrl = (hostUrl) => {
  const index = hostUrl ? HIVE_ENGINE_NODES.indexOf(hostUrl) : 0;

  return index === HIVE_ENGINE_NODES.length - 1
    ? HIVE_ENGINE_NODES[0]
    : HIVE_ENGINE_NODES[index + 1];
};
