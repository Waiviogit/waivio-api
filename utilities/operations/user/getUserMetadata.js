const _ = require('lodash');
const {
  User,
  SpamUserModel,
  mutedUserModel,
} = require('../../../models');
const { WAIVIO_ADMINS_ENV } = require('../../../constants/common');

const checkMuted = async ({
  userName,
  app,
}) => {
  const restricted = await SpamUserModel.isRestricted(userName);
  if (restricted) return true;

  const { mutedUser } = await mutedUserModel.findOne({
    $or: [
      {
        mutedForApps: _.get(app, 'host'),
        userName,
      },
      {
        mutedBy: { $in: WAIVIO_ADMINS_ENV },
        userName,
      }],
  });

  return !!mutedUser;
};

module.exports = async ({
  userName,
  app,
}) => {
  const { user, error } = await User.getOne(userName, { user_metadata: 1, privateEmail: 1 });
  if (error || !user) {
    return { error: error || { status: 404, message: 'User not Found!' } };
  }
  const muted = await checkMuted({ userName, app });

  return {
    user_metadata: user.user_metadata,
    privateEmail: user.privateEmail,
    muted,
  };
};
