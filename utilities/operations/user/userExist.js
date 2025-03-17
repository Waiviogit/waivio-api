const { User } = require('../../../models');

const hiveUserExist = async ({ userName = '' }) => {
  if (userName.includes('_')) return { result: false };

  const { user } = await User.getOne(userName, 'name');

  return { result: !!user };
};

module.exports = {
  hiveUserExist,
};
