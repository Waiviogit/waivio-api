const _ = require('lodash');
const { User, Subscriptions } = require('models');

module.exports = async ({ name, skip, limit }) => {
  const { users, error } = await Subscriptions.getFollowers({
    following: name, skip, limit: limit + 1,
  });
  if (error) return { error };
  if (!users.length) return { result: { followers: [], hasMore: false } };
  const { usersData, error: usersError } = await User.find(
    { condition: { name: { $in: users } } },
  );
  if (usersError) return { error: usersError };
  const result = _
    .chain(usersData)
    .map((user) => ({
      name: user.name,
      wobjects_weight: user.wobjects_weight,
      followers_count: user.followers_count,
    }))
    .slice(0, limit)
    .value();

  return { result: { followers: result, hasMore: users.length === limit + 1 } };
};
