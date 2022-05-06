const { startImportUser } = require('utilities/operations/user/importSteemUserBalancer');
const { Subscriptions, mutedUserModel, User } = require('models');
const { userUtil } = require('utilities/hiveApi');
const _ = require('lodash');

const getOne = async ({
  name, with_followings: withFollowings, app, userName,
}) => {
  const { userData = {} } = await userUtil.getAccount(name);
  // eslint-disable-next-line prefer-const
  let { user, error: dbError } = await User.getOne(name); // get user data from db

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

  user.id = user._id.toString(); // for front (was user to json) to render guest users
  if (_.get(user, 'auth.provider')) user.provider = user.auth.provider;
  if (withFollowings) {
    const { users } = await Subscriptions.getFollowings({ follower: name, limit: 0 });
    user.users_follow = users || [];
  } else user = _.omit(user, ['users_follow', 'objects_follow']);

  const { result: mutedUsers } = await mutedUserModel.find({
    condition:
      { $or: [{ userName: user.name, mutedForApps: _.get(app, 'host') }, { mutedBy: userName, userName: name }] },
  });

  const userForResponse = {
    userData: Object.assign(userData, user, {
      muted: !_.isEmpty(mutedUsers),
      mutedBy: _.reduce(mutedUsers, (acc, el) => (_.includes(el.mutedForApps, _.get(app, 'host')) ? [...acc, el.mutedBy] : acc), []),
    }),
  };

  return userForResponse;
};

module.exports = getOne;
