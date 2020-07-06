const _ = require('lodash');
const { User, Subscriptions } = require('models');
const { userUtil } = require('utilities/steemApi');

/**
 * Import full user info from STEEM to mongodb:
 * alias, profile_image, json_metadata, last_root_post, followers_count, followings(array)
 * @param userName {String}
 * @returns {Promise<{user: (Object)}|{error: (Object)}>} error or created(updated) user
 */
exports.importUser = async (userName) => {
  const { user: existUser, error: dbError } = await User.getOne(userName);

  if (dbError) console.error(dbError);
  if (_.get(existUser, 'stage_version') === 1) return { user: existUser };

  const {
    data: userData, error: steemError,
  } = await this.getUserSteemInfo(userName);

  if (steemError) return { error: steemError };

  await updateUserFollowings(userName);

  return User.updateOne(
    { name: userName },
    { ...userData, stage_version: 1 },
  );
};

/**
 * Get main info about user from STEEM
 * Return object with keys: name, alias, profile_image, json_metadata, last_root_post
 * @param name
 * @returns {Promise<{data: (Object)}|{error: (*|string)}>}
 */
exports.getUserSteemInfo = async (name) => {
  const { userData, error: steemError } = await userUtil.getAccount(name);
  if (steemError || !userData) return { error: steemError || `User ${name} not exist, can't import.` };

  const { result: followCountRes, error: followCountErr } = await userUtil.getFollowCount(name);
  if (followCountErr) return { error: followCountErr };

  const { count: guestFollCount, error: guestFollErr } = await Subscriptions
    .getGuestFollowersCount(name);
  if (guestFollErr) return { error: guestFollErr };

  const data = {
    name,
    alias: _.get(parseString(userData), 'posting_json_metadata.profile.name', ''),
    profile_image: _.get(parseString(userData), 'posting_json_metadata.profile.profile_image', ''),
    json_metadata: userData.json_metadata,
    posting_json_metadata: userData.posting_json_metadata,
    last_root_post: userData.last_root_post,
    followers_count: _.get(followCountRes, 'follower_count', 0) + guestFollCount,
  };

  return { data };
};

// PRIVATE METHODS //

/**
 * Update user following list from STEEM
 * This operation can take a lot of time execution
 * (up to 7-8 minutes if user follow around 900k users)
 * @param name
 * @returns {Promise<{ok: boolean}|{error: *}>}
 */
const updateUserFollowings = async (name) => {
  const batchSize = 1000;
  let currBatchSize = 0;
  let startAccount = '';
  const { subscriptionData, error: subsError } = await Subscriptions
    .find({ condition: { follower: name } });
  const dbArray = _.map(subscriptionData, (el) => el.following);

  do {
    const { followings = [], error } = await userUtil.getFollowingsList({
      name, startAccount, limit: batchSize,
    });

    if (error || followings.error || subsError) {
      console.error(error || followings.error || subsError);
      return { error: error || followings.error || subsError };
    }
    const hiveArray = _.map(followings, (el) => el.following);
    currBatchSize = followings.length;
    startAccount = _.get(followings, `[${batchSize - 1}].following`, '');

    await Promise.all(_.map(followings, async (el) => {
      if (!_.includes(dbArray, el.following)) {
        const { result, error: dbError } = await Subscriptions
          .followUser({ follower: name, following: el.following });
        // await User.updateOne({ name: el.following }, { $inc: { followers_count: 1 } });
        result && console.log(`success, ${name} follows ${el.following}`);
        dbError && console.error(dbError);
      }
    }));
    await Promise.all(_.map(dbArray, async (el) => {
      if (!_.includes(hiveArray, el)) {
        const { result, error: dbError } = await Subscriptions
          .unfollowUser({ follower: name, following: el });
        // await User.updateOne({ name: el }, { $inc: { followers_count: -1 } });
        result && console.log(`success, ${name} unfollows ${el}`);
        dbError && console.error(dbError);
      }
    }));
  } while (currBatchSize === batchSize);
  return { ok: true };
};

const parseString = (str) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    return { error };
  }
};
