const axios = require('axios');
const _ = require('lodash');
const { REQUEST_TIMEOUT } = require('../../constants/common');
const { urlRotationManager } = require('./urlRotation');

const engineQuery = async ({
  method = 'find',
  params,
  endpoint = '/contracts',
  id = 'ssc-mainnet-hive',
}) => {
  const startTime = Date.now();
  const hostUrl = await urlRotationManager.getBestUrl();

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

    const responseTime = Date.now() - startTime;
    const result = _.get(resp, 'data.result');

    // Record successful request
    await urlRotationManager.recordRequest(hostUrl, responseTime, false);

    return result;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`Engine request error ${hostUrl}`);

    // Record failed request
    await urlRotationManager.recordRequest(hostUrl, responseTime, true);

    return { error };
  }
};

const engineProxy = async ({
  method,
  params,
  endpoint,
  id,
  attempts = 5,
}) => {
  let remainingAttempts = attempts;

  while (remainingAttempts > 0) {
    const response = await engineQuery({
      method,
      params,
      endpoint,
      id,
    });

    if (!_.has(response, 'error')) {
      return response;
    }

    remainingAttempts--;
  }

  // Final attempt with best available URL
  return engineQuery({
    method,
    params,
    endpoint,
    id,
  });
};

module.exports = {
  engineProxy,
  engineQuery,
};
