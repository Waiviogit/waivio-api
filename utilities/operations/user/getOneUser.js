const { User } = require('database').models;
const { userUtil: userSteemUtil } = require('utilities/steemApi');
const _ = require('lodash');

const getDbUser = async (name) => {
  try {
    const user = await User
      .findOne({ name })
      .populate('objects_shares_count');

    return user ? { user: user.toJSON() } : {};
  } catch (error) {
    return { error };
  }
};

// eslint-disable-next-line camelcase
const getOne = async ({ name, with_followings }) => {
  const { userData = {} } = await userSteemUtil.getAccount(name);

  // eslint-disable-next-line prefer-const
  let { user, error: dbError } = await getDbUser(name); // get user data from db

  // eslint-disable-next-line camelcase
  if (!with_followings) {
    user = _.omit(user, ['users_follow', 'objects_follow']);
  }
  if (dbError || (!user && _.isEmpty(userData))) {
    return { error: dbError || { status: 404, message: `User ${name} not found!` } };
  }

  if (!user) return { userData };

  Object.assign(userData, user); // combine data from db and blockchain
  return { userData };
};

module.exports = getOne;
