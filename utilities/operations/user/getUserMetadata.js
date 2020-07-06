const { User } = require('models');

module.exports = async (userName) => {
  // method updateOne find user and try to update it, but if user not exist
  // - create and return created new user
  const { user, error } = await User.updateOne({ name: userName });

  if (error) return { error };
  return { user_metadata: user.user_metadata, privateEmail: user.privateEmail };
};
