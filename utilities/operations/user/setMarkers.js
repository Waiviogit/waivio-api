const { User } = require('../../../models');

exports.newUser = async (name) => {
  const { user, error } = await User.updateOne({ name }, { $set: { 'user_metadata.new_user': false } });
  return !(error || !user);
};
