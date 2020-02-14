const _ = require('lodash');
const { User } = require('models');

module.exports = async ({ name, skip, limit }) => {
  const { users, error } = await User.getFollowers({ name, skip, limit: limit + 1 });

  if (error) return { error };

  const followers = _.chain(users || []).slice(0, limit).map((u) => u.name).value();

  return { result: { followers, hasMore: users.length === limit + 1 } };
};
