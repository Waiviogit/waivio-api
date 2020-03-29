const _ = require('lodash');
const { User } = require('models');

module.exports = async ({ name, skip, limit }) => {
  const { users, error } = await User.getFollowers({ name, skip, limit: limit + 1 });

  if (error) return { error };

  return { result: { followers: _.slice(users, 0, limit), hasMore: users.length === limit + 1 } };
};
