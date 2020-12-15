const { User, wobjectSubscriptions } = require('models');
const _ = require('lodash');

module.exports = async (userName, app) => {
  // method updateOne find user and try to update it, but if user not exist
  // - create and return created new user
  const moderatorsArr = [..._.get(app, 'moderators'), _.get(app, 'owner')];
  const { user, error } = await User.getOne(userName, '+user_metadata');
  if (error || !user) return { error: error || { status: 404, message: 'User not Found!' } };
  const { count: objectsFollowCount } = await wobjectSubscriptions
    .getFollowingsCount(user.name);
  user.user_metadata.new_user = user.user_metadata.new_user
      && !user.users_following_count && !objectsFollowCount;
  return {
    user_metadata: { ...user.user_metadata, canMute: _.includes(moderatorsArr, userName) },
    privateEmail: user.privateEmail,
  };
};
