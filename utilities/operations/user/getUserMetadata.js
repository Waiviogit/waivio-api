const { User, wobjectSubscriptions } = require('models');

module.exports = async (userName) => {
  const { user, error } = await User.getOne(userName, ['+user_metadata', '+privateEmail']);
  if (error || !user) return { error: error || { status: 404, message: 'User not Found!' } };
  const { count: objectsFollowCount } = await wobjectSubscriptions.getFollowingsCount(user.name);

  user.user_metadata.new_user = user.user_metadata.new_user
      && !user.users_following_count && !objectsFollowCount;
  return { user_metadata: user.user_metadata, privateEmail: user.privateEmail };
};
