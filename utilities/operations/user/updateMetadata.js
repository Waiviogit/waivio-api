const { User } = require('models');

// eslint-disable-next-line camelcase
module.exports = async ({ user_name, user_metadata }) => {
  user_metadata.drafts = user_metadata.drafts.slice(21, -1);
  const { user, error } = await User.updateOne({ name: user_name }, { $set: { user_metadata } });

  if (error) return { error };
  return { user_metadata: user.user_metadata };
};
