const { User } = require('models');

module.exports = async ({ name, skip, limit }) => {
  const { users, error } = await User.getFollowings({ name, skip, limit: limit + 1 });

  if (error) return { error };

  return { result: { users: users.slice(0, limit), hasMore: users.length === limit + 1 } };
};
