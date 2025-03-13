const crypto = require('crypto');

const privateKeyString = process.env.CHANGELLY_PRIVATE_KEY;

const privateKey = crypto.createPrivateKey({
  key: privateKeyString,
  format: 'der',
  type: 'pkcs8',
  encoding: 'hex',
});

const publicKey = crypto.createPublicKey(privateKey).export({
  type: 'pkcs1',
  format: 'der',
});

const formRequest = (message) => {
  const signature = crypto.sign('sha256', Buffer.from(JSON.stringify(message)), {
    key: privateKey,
    type: 'pkcs8',
    format: 'der',
  });

  return {
    method: 'POST',
    url: 'https://api.changelly.com/v2',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': crypto.createHash('sha256').update(publicKey).digest('base64'),
      'X-Api-Signature': signature.toString('base64'),
    },
    body: JSON.stringify(message),
  };
};

const fetchData = async ({
  method, url, headers, body,
}) => {
  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    const data = await response.json();
    if (data.error) {
      return { error: { status: 422, message: data.error.message } };
    }
    return { result: data.result };
  } catch (error) {
    return { error };
  }
};

const getHivePairs = async ({ from = 'hive', txType = 'fixed' }) => {
  const requestData = formRequest({
    jsonrpc: '2.0',
    id: 'test',
    method: 'getPairs',
    params:
      {
        from, txType,
      },
  });

  const { result, error } = await fetchData(requestData);
  if (error) return { error };
  return { result };
};

// 1 get min and max amount from currency
const getPairParams = async ({ from = 'hive', to }) => {
  const requestData = formRequest({
    jsonrpc: '2.0',
    id: 'test',
    method: 'getPairsParams',
    params:
      {
        from,
        to,
      },
  });

  const { result, error } = await fetchData(requestData);
  if (error) return { error };
  return { result: result[0] };
};

// 2
const getExchangeAmount = async ({ from = 'hive', to, amountFrom }) => {
  const requestData = formRequest({
    jsonrpc: '2.0',
    id: 'test',
    method: 'getExchangeAmount',
    params:
      {
        from,
        to,
        amountFrom,
      },
  });

  const { result, error } = await fetchData(requestData);
  if (error) return { error };
  return { result: result[0] };
};

// 3
const createTransaction = async ({
  from = 'hive',
  to,
  amountFrom,
  address,
  refundAddress,
}) => {
  const requestData = formRequest({
    jsonrpc: '2.0',
    id: 'test',
    method: 'createTransaction',
    params:
      {
        from,
        to,
        amountFrom,
        address,
        refundAddress,
      },
  });

  const { result, error } = await fetchData(requestData);
  if (error) return { error };
  return { result };
};

const createExchangeWrapper = async ({
  address, amount, outputCoinType, refundAddress,
}) => {
  const { result, error } = await createTransaction({
    from: 'hive',
    to: outputCoinType,
    amountFrom: amount,
    address,
    refundAddress,
  });
  if (error) return { error };

  const {
    payinExtraId, payinAddress, id, amountExpectedTo, trackUrl,
  } = result;

  return {
    result: {
      memo: payinExtraId,
      receiver: payinAddress,
      exchangeId: id,
      outputAmount: amountExpectedTo,
      trackUrl,
    },
  };
};

module.exports = {
  createTransaction,
  getExchangeAmount,
  getPairParams,
  createExchangeWrapper,
};
