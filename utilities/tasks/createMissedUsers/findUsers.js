const _ = require('lodash');
const axios = require('axios');
const { REQUEST_TIMEOUT } = require('../../../constants/common');

/**
 * Task for import user to our data base from anyx
 * @param url {string}
 * @param startAcc {string} from which following need to start
 * @returns {Promise<{error: *}>}
 */
const addUsersToImport = async ({ url, startAcc = '' }) => {
  const batchSize = 1000;
  let currBatchSize = 0;
  let startAccount = startAcc;
  do {
    const { users, error } = await anyxRequest({
      start: startAccount, limit: batchSize,
    });

    if (error) {
      console.error('addUsersToImport anyxRequest Error');
      return { error };
    }
    currBatchSize = users.length;
    startAccount = _.get(users, `[${batchSize - 1}].name`, '');
    for (const user of users) {
      let res, counter = 0;
      do {
        counter += 1;
        await new Promise((resolve) => setTimeout(resolve, 150));
        res = await request(url, user.name);
        if (res.error) await new Promise((resolve) => setTimeout(resolve, 3000));
        if (_.get(res, 'result.ok', false)) console.log(`User ${user.name} add to import`);
      } while (!_.get(res, 'result.ok', false) || counter === 10);
    }
  } while (currBatchSize === batchSize);
};

const anyxRequest = async ({ start, limit }) => {
  try {
    const result = await axios.post(
      'https://anyx.io',
      {
        jsonrpc: '2.0',
        method: 'database_api.list_accounts',
        params: {
          start,
          limit,
          order: 'by_name',
        },
        id: 1,
      },
      {
        timeout: REQUEST_TIMEOUT,
      },
    );
    return { users: result.data.result.accounts };
  } catch (error) {
    return { error };
  }
};

const request = async (url, name) => {
  try {
    const result = await axios.get(
      `https://${url}/api/import_steem_user?userName=${name}`,
      {
        timeout: REQUEST_TIMEOUT,
      },
    );
    return { result: result.data };
  } catch (e) {
    if (e.response.status === 400 && e.response.data.message === `User ${name} is already imported!`) return { result: { ok: true } };
    if (e.response.status === 423 && e.response.data.message === `User ${name} is being imported!`) return { result: { ok: true } };
    console.error(`Something wrong with user ${name}`);
    return { error: e };
  }
};

module.exports = { addUsersToImport };
