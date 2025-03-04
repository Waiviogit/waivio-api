// task unavailable. For use should replace users_follow request from User to Subscription model
const _ = require('lodash');
const { User } = require('database').models;
const axios = require('axios');
const { REQUEST_TIMEOUT } = require('../../../constants/common');

exports.findFollowersCountAndUpdate = async () => {
  const users = await User.find({ stage_version: 0 });

  for (const doc of users) {
    let result, error, counter = 0, start = '', guestLength = 0;
    if (!_.get(doc, 'auth.provider', null)) {
      do {
        ({ result, error } = await getFollowers(doc.name, start));
        if (_.get(result, 'error.message', '') === 'Request Timeout') {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        if (error) break;
        counter += result.result.length - 1;
        start = result.result.length ? result.result[result.result.length - 1].follower : '';
      } while (!result.error && result.result.length === 1000);
      const dbResult = await User.find({ users_follow: doc.name, name: { $in: [new RegExp('waivio_'), new RegExp('bxy_')] } });
      guestLength = dbResult.length + 1;
    } else {
      const dbResult = await User.find({ users_follow: doc.name });
      guestLength = dbResult.length;
    }
    const res = await User.updateOne({ name: doc.name }, { $set: { followers_count: counter + guestLength } });
    if (res.nModified) {
      console.log(`User ${doc.name} "followers_count" updated!`);
    }
  }
};

const getFollowers = async (name, start) => {
  try {
    const result = await axios.post(
      'https://anyx.io/',
      {
        id: 0,
        jsonrpc: '2.0',
        method: 'call',
        params: [
          'condenser_api',
          'get_followers',
          [name, start, 'blog', 1000],
        ],
      },
      {
        timeout: REQUEST_TIMEOUT,
      },
    );
    return { result: result.data };
  } catch (error) {
    return { error };
  }
};
