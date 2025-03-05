const { User } = require('../../../models');

module.exports = async (userName) => {
  const { user, error } = await User.getOne(userName, { user_metadata: 1, privateEmail: 1 });
  if (error || !user) return { error: error || { status: 404, message: 'User not Found!' } };
  return { user_metadata: user.user_metadata, privateEmail: user.privateEmail };
};
