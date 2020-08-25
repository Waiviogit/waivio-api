const { User } = require('models');

module.exports = async (userName) => {
  // method updateOne find user and try to update it, but if user not exist
  // - create and return created new user
  const { user, error } = await User.getOne(userName, '+user_metadata');
  if (error || !user) return { error: error || { status: 404, message: 'User not Found!' } };

  user.user_metadata.new_user = user.user_metadata.new_user
      && !user.users_following_count && !user.objects_follow.length;
  return { user_metadata: user.user_metadata, privateEmail: user.privateEmail };
};
