const { User } = require('models');


exports.newUser = async (name) => {
  const { user, error } = await User.updateOne({ name }, { $set: { new_user: false } });
  return !(error || !user);
};
