const { User } = require('models');
const _ = require('lodash');
// eslint-disable-next-line camelcase
module.exports = async ({ user_name, user_metadata }) => {
  if (!_.get(user_metadata, 'settings.userNotifications.minimalTransfer')) {
    const { user: client, error: clientError } = await User.getOne(user_name, '+user_metadata');
    if (clientError) return { error: clientError };
    user_metadata.settings.userNotifications.minimalTransfer = _
      .get(client, 'user_metadata.settings.userNotifications.minimalTransfer');
  }
  const { user, error } = await User.updateOne({ name: user_name }, { $set: { user_metadata } });

  if (error) return { error };
  return { user_metadata: user.user_metadata };
};
