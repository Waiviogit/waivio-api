const { userUtil } = require('../../hiveApi');
const { GUEST_NAME } = require('../../../constants/regExp');
const { User } = require('../../../models');
const moment = require('moment');

module.exports = async (name) => {
  if (!name) return { error: { status: 404, message: 'Not Found' } };
  return GUEST_NAME.test(name)
    ? getGuestCreationDate(name)
    : getHiveCreationDate(name);
};

const getGuestCreationDate = async (name) => {
  const { user, error } = await User.getOne(name);
  if (error) return { error };

  return { timestamp: moment(user.createdAt).unix() };
};

const getHiveCreationDate = async (name) => {
  const { userData = {}, error } = await userUtil.getAccount(name);
  if (error) return { error };

  return { timestamp: moment(userData.created).unix() };
};
