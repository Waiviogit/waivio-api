const { startImportUser } = require('utilities/operations/user/importSteemUserBalancer');
const { Subscriptions, mutedUserModel, User } = require('models');

const _ = require('lodash');
const { getUserCanonical } = require('../../helpers/cannonicalHelper');

const getOne = async ({
  name, with_followings: withFollowings, app, userName,
}) => {
  // eslint-disable-next-line prefer-const
  let { user, error: dbError } = await User.getOne(name);

  if (dbError) return { error: dbError };

  if (!user) {
    const importResult = await startImportUser(name);
    if (_.get(importResult, 'result.ok')) console.log(`Started import user ${name}!`);
    return { error: dbError || { status: 404, message: `User ${name} not found!` } };
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

  if (!user.canonical) {
    const { canonical, post } = await getUserCanonical({ name: user.name });
    user.canonical = canonical;
    if (post) await User.updateOne({ name: user.name }, { canonical });
  }

  return {
    userData: Object.assign(user, {
      muted: !_.isEmpty(mutedUsers),
      mutedBy: _.reduce(mutedUsers, (acc, el) => (_.includes(el.mutedForApps, _.get(app, 'host')) ? [...acc, el.mutedBy] : acc), []),
    }),
  };
};

module.exports = getOne;
