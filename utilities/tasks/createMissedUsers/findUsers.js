const { userUtil } = require('utilities/steemApi');
const _ = require('lodash');
const axios = require('axios');

const updateUserFollowings = async ({ url, name, startAcc = '' }) => {
  const batchSize = 1000;
  let currBatchSize = 0;
  let startAccount = startAcc;
  do {
    const { followings = [], error } = await userUtil.getFollowingsList({
      name, startAccount, limit: batchSize,
    });

    if (error || followings.error) {
      console.error(error || followings.error);
      return { error: error || followings.error };
    }
    currBatchSize = followings.length;
    startAccount = _.get(followings, `[${batchSize - 1}].following`, '');
    console.log(startAccount);
    for (const user of followings) {
      let res, counter = 0;
      do {
        counter += 1;
        await new Promise((resolve) => setTimeout(resolve, 150));
        res = await request(url, user.following);
        if (res.error) await new Promise((resolve) => setTimeout(resolve, 3000));
        if (_.get(res, 'result.ok', false)) console.log(`User ${user.following} add to import`);
      } while (!_.get(res, 'result.ok', false) || counter === 10);
    }
  } while (currBatchSize === batchSize);
};


const request = async (url, name) => {
  try {
    const result = await axios.get(`https://${url}/api/import_steem_user?userName=${name}`);
    return { result: result.data };
  } catch (e) {
    if (e.response.status === 400 && e.response.data.message === `User ${name} is already imported!`) return { result: { ok: true } };
    if (e.response.status === 423 && e.response.data.message === `User ${name} is being imported!`) return { result: { ok: true } };
    console.error(`Something wrong with user ${name}`);
    return { error: e };
  }
};


module.exports = { updateUserFollowings };
