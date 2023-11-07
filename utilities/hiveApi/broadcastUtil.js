const { PrivateKey, Asset } = require('@hiveio/dhive');
const { getRegularClient } = require('./clientOptions');
/**
 * @param from {string}
 * @param to {string}
 * @param amount {number}
 * @param memo {string | undefined}
 * @param activeKey
 * @returns {Promise<{result: boolean}|{error: any}>}
 */
exports.transfer = async ({
  from, to, amount, memo = '', activeKey,
}) => {
  try {
    const client = await getRegularClient();
    const data = await client.broadcast.transfer({
      from, to, amount: new Asset(amount, 'HIVE'), memo,
    }, PrivateKey.fromString(activeKey));
    return { result: data };
  } catch (error) {
    return { error };
  }
};
