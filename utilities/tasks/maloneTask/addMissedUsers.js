const _ = require('lodash');
const { User, Subscriptions } = require('database').models;
const { importUser } = require('utilities/operations/user/importSteemUserOps');
const axios = require('axios');
const { REQUEST_TIMEOUT } = require('../../../constants/common');

exports.add = async () => {
  const usersDB = await User.find({ followers_count: { $gt: 5000, $lt: 10000 } }, { name: 1 }).lean();
  const users = _.map(usersDB, 'name');

  for (const usr of users) {
    const batchSize = 1000;
    let currBatchSize = 0;
    let startAccount = '';
    let userFollowers = [], userFollowings = [];
    const { data } = await followCount(usr);
    const DBFollowersCount = await Subscriptions.find({ following: usr, follower: { $nin: [/waivio_/, /bxy_/] } });
    const DBFollowingsCount = await Subscriptions.find({ follower: usr, following: { $nin: [/waivio_/, /bxy_/] } });
    if (DBFollowersCount.length === data.follower_count && DBFollowingsCount.length === data.following_count) {
      console.log(`All followers/followings at user ${usr} OK`);
      continue;
    }
    if (DBFollowersCount.length !== data.follower_count) {
      do {
        const { followers, error } = await anyxRequest({
          start: startAccount, limit: batchSize, name: usr,
        });
        if (error || !followers) {
          console.error('Followers not found');
          return { error };
        }
        userFollowers = _.uniq(_.concat(userFollowers, _.map(followers, 'follower')));
        currBatchSize = followers.length;
        startAccount = _.get(followers, `[${batchSize - 1}].follower`, '');
      } while (currBatchSize === batchSize);
    }
    if (DBFollowingsCount.length !== data.following_count) {
      currBatchSize = 0;
      startAccount = '';
      do {
        const { followings, error: err } = await anyxRequestFollowings({
          start: startAccount, limit: batchSize, name: usr,
        });
        if (err || !followings) {
          console.error('Followings not found');
          return { err };
        }
        userFollowings = _.uniq(_.concat(userFollowings, _.map(followings, 'following')));
        currBatchSize = followings.length;
        startAccount = _.get(followings, `[${batchSize - 1}].following`, '');
      } while (currBatchSize === batchSize);
    }
    const dbUser = await User.findOne({ name: usr });
    if (!dbUser) await importUser(usr);
    const dataToDelete = [];
    if (userFollowers.length) dataToDelete.push(..._.map(DBFollowersCount, '_id'));
    if (userFollowings.length) dataToDelete.push(..._.map(DBFollowingsCount, '_id'));
    await Subscriptions.deleteMany({ _id: dataToDelete });
    if (userFollowers.length) {
      for (const follower of userFollowers) {
        const db = await User.findOne({ name: follower });
        if (!db) await importUser(follower);
        await followUser({ follower, following: usr });
      }
    } if (userFollowings.length) {
      for (const following of userFollowings) {
        const dbU = await User.findOne({ name: following });
        if (!dbU) await importUser(following);
        await followUser({ follower: usr, following });
      }
    }
  }
};

const anyxRequest = async ({ name, start, limit }) => {
  try {
    const result = await axios.post(
      'https://anyx.io',
      {
        jsonrpc: '2.0',
        method: 'call',
        params: [
          'follow_api',
          'get_followers',
          [name, start, 'blog', limit],
        ],
      },
      {
        timeout: REQUEST_TIMEOUT,
      },
    );
    return { followers: result.data.result };
  } catch (error) {
    return { error };
  }
};

const followUser = async ({ follower, following }) => {
  const newSubscribe = new Subscriptions({
    follower,
    following,
  });

  try {
    await newSubscribe.save();
    return { result: true };
  } catch (error) {
    return { error };
  }
};

const anyxRequestFollowings = async ({ name, start, limit }) => {
  try {
    const result = await axios.post(
      'https://anyx.io',
      {
        jsonrpc: '2.0',
        method: 'call',
        params: [
          'follow_api',
          'get_following',
          [name, start, 'blog', limit],
        ],
      },
      {
        timeout: REQUEST_TIMEOUT,
      },
    );
    return { followings: result.data.result };
  } catch (error) {
    return { error };
  }
};

const followCount = async (name) => {
  try {
    const result = await axios.post(
      'https://anyx.io',
      {
        jsonrpc: '2.0',
        method: 'call',
        params: [
          'follow_api',
          'get_follow_count',
          [name],
        ],
      },
      {
        timeout: REQUEST_TIMEOUT,
      },
    );
    return { data: result.data.result };
  } catch (error) {
    return { error };
  }
};
