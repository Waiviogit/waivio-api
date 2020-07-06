const { User } = require('database').models;
const { userUtil: userSteemUtil } = require('utilities/steemApi');
const { startImportUser } = require('utilities/operations/user/importSteemUserBalancer');
const { Subscriptions } = require('models');
const _ = require('lodash');

const getDbUser = async (name) => {
  try {
    const user = await User
      .findOne({ name })
      .populate('objects_shares_count');
    const foundUser = user.toJSON();
    foundUser.users_following_count = user.users_following_count;
    return user ? { user: foundUser } : {};
  } catch (error) {
    return { error };
  }
};

const getOne = async ({ name, with_followings: withFollowings }) => {
  const { userData = {} } = await userSteemUtil.getAccount(name);
  // eslint-disable-next-line prefer-const
  let { user, error: dbError } = await getDbUser(name);// get user data from db
  if (dbError) return { error: dbError };

  if (!user) {
    // If user not exist in DB and STEEM -> return error,
    // else if user exist in steem but not in DB -> invoke import user operation
    if (_.isEmpty(userData)) {
      return { error: dbError || { status: 404, message: `User ${name} not found!` } };
    }
    const importResult = await startImportUser(name);
    if (_.get(importResult, 'result.ok')) console.log(`Started import user ${name}!`);
    return { userData };
  }

  if (_.get(user, 'auth.provider')) user.provider = user.auth.provider;
  if (withFollowings) {
    const { users } = await Subscriptions.getFollowings({ follower: name, limit: 0 });
    user.users_follow = users || [];
  } else user = _.omit(user, ['users_follow', 'objects_follow']);

  Object.assign(userData, user);// combine data from db and blockchain
  return { userData };
};

module.exports = getOne;
