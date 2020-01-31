const _ = require('lodash');
const { User } = require('../../../models');
const { userUtil } = require('../../steemApi');

/**
 * Import full user info from STEEM to mongodb:
 * alias, profile_image, json_metadata, last_root_post, followers_count, followings(array)
 * @param userName {String}
 * @returns {Promise<{user: (Object)}|{error: (Object)}>} error or created(updated) user
 */
exports.importUser = async (userName) => {
  const { user: existUser, error: dbError } = await User.getOne(userName);

  if (dbError) console.error(dbError);
  if (existUser) return { user: existUser };
  const { data: userData, error: steemError } = await this.getUserSteemInfo(userName);

  if (steemError) return { error: steemError };

  return User.updateOne({ name: userName }, userData);
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
  const userFollowings = await getUserFollowings(name);

  const data = {
    name,
    alias: _.get(parseString(userData.json_metadata), 'profile.name', ''),
    profile_image: _.get(parseString(userData.json_metadata), 'profile.profile_image', ''),
    json_metadata: userData.json_metadata,
    last_root_post: userData.last_root_post,
    followers_count: _.get(followCountRes, 'follower_count', 0),
    users_follow: userFollowings,
  };

  return { data };
};

/**
 * Return all user following list from STEEM
 * This operating can take a lot of time execution
 * @param name {String}
 * @returns {Promise<unknown[]>}
 */
const getUserFollowings = async (name) => {
  const batchSize = 1000;
  let currBatchSize = 0;
  let startAccount = '';
  const followingSet = new Set();

  do {
    const { followings = [], error } = await userUtil.getFollowingsList({
      name, startAccount, limit: batchSize,
    });

    if (error) {
      console.error(error);
      return Array.from(followingSet);
    }
    currBatchSize = followings.length;
    followings.forEach((f) => followingSet.add(f.following));
    startAccount = _.get(followings, `[${batchSize - 1}].following`, '');
  } while (currBatchSize === batchSize);
  return Array.from(followingSet);
};

// /**
//  * Retrieves list of user followings and update(or create) user in DB
//  * @param name {String} user name
//  * @returns {Promise<{user: *}|{error: *}>} Return updated user or error
//  */
// exports.importFollowingUsersList = async ( name ) => {
//     const followings = await getUserFollowings( name );
//     return User.updateOne( { name }, { $set: { users_follow: followings } } );
// };

const parseString = (str) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    return { error };
  }
};
