const _ = require('lodash');
const { userUtil } = require('../../hiveApi');
const { User, Subscriptions } = require('../../../models');

/**
 * Import full user info from STEEM to mongodb:
 * alias, profile_image, json_metadata, last_root_post, followers_count, followings(array)
 * @param userName {String}
 * @returns {Promise<{user: (Object)}|{error: (Object)}>} error or created(updated) user
 */
exports.importUser = async (userName) => {
  const { user: existUser, error: dbError } = await User.getOne(userName);

  if (_.get(existUser, 'stage_version') === 1) return { user: existUser };

  const {
    data: userData, error: steemError,
  } = await this.getUserSteemInfo(userName);

  if (steemError) return { error: steemError };

  await updateUserFollowings(userName);
  await updateUserFollowers(userName);
  return User.updateOne({ name: userName }, { ...userData, stage_version: 1 });
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
    .getGuestSubscriptionsCount(name, true);
  const { count: guestFollowingsCount } = await Subscriptions
    .getGuestSubscriptionsCount(name, false);
  if (guestFollErr) return { error: guestFollErr };

  const metadata = parseString(userData.json_metadata);
  const postingMetadata = parseString(userData.posting_json_metadata);
  const data = {
    name,
    alias: _.get(postingMetadata, 'profile.name', _.get(metadata, 'profile.name', '')),
    profile_image: _.get(postingMetadata, 'profile.profile_image', _.get(metadata, 'profile.profile_image', '')),
    json_metadata: userData.json_metadata,
    posting_json_metadata: userData.posting_json_metadata,
    last_root_post: userData.last_root_post,
    user_following_count: _.get(followCountRes, 'following_count', 0) + guestFollowingsCount,
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
  let hiveArray = [];

  do {
    const { followings = [], error } = await userUtil.getFollowingsList(
      { name, startAccount, limit: batchSize },
    );

    if (error || followings.error) {
      console.error('getFollowingsList Error');
      return { error: error || followings.error };
    }
    hiveArray = _.concat(hiveArray, _.map(followings, (el) => el.following));
    currBatchSize = followings.length;
    startAccount = _.get(followings, `[${currBatchSize - 1}].following`, '');
  } while (currBatchSize === batchSize);

  let { users } = await Subscriptions.getFollowings({ follower: name, limit: 0 });
  users = _.filter(users, (u) => !u.includes('_'));
  const deleteData = _.difference(users, hiveArray);
  const updateData = _.difference(hiveArray, users);

  for (const following of updateData) await Subscriptions.followUser({ follower: name, following });
  await Subscriptions.deleteMany({ follower: name, following: { $in: deleteData } });

  return { ok: true };
};

const updateUserFollowers = async (name) => {
  const batchSize = 1000;
  let currBatchSize = 0;
  let startAccount = '';
  let hiveArray = [];

  do {
    const { followers = [], error } = await userUtil.getFollowersList(
      { name, startAccount, limit: batchSize },
    );

    if (error || followers.error) {
      console.error('getFollowersList error');
      return { error: error || followers.error };
    }
    hiveArray = _.concat(hiveArray, _.map(followers, (el) => el.follower));
    currBatchSize = followers.length;
    startAccount = _.get(followers, `[${currBatchSize - 1}].follower`, '');
  } while (currBatchSize === batchSize);

  let { users } = await Subscriptions.getFollowers({ following: name, limit: 0 });
  users = _.filter(users, (u) => !u.includes('_'));
  const deleteData = _.difference(users, hiveArray);
  const updateData = _.difference(hiveArray, users);

  for (const follower of updateData) await Subscriptions.followUser({ follower, following: name });
  await Subscriptions.deleteMany({ follower: { $in: deleteData }, following: name });

  return { ok: true };
};

const parseString = (str) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    return { error };
  }
};
