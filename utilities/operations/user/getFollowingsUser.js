const _ = require('lodash');
const { User } = require('models');

exports.getAll = async ({ name, skip, limit }) => {
  const { users, error } = await User.getFollowings({ name, skip, limit: limit + 1 });

  if (error) return { error };
  if (!users.length) return { result: { users: [], hasMore: false } };

  const { usersData, error: usersError } = await User.find(
    { condition: { name: { $in: users } } },
  );
  if (usersError) return { error: usersError };

  const result = _
    .chain(usersData)
    .map((user) => ({
      name: user.name,
      wobjects_weight: user.wobjects_weight,
      youFollows: true,
    }))
    .slice(0, limit)
    .value();


  return { result: { users: result, hasMore: users.length === limit + 1 } };
};

// returns collection of users with boolean markers
exports.getFollowingsArray = async (data) => {
  const { user, error } = await User.getOne(data.name);

  if (error) return { error: { status: 503, message: error.message } };

  return { users: _.map(data.users, (name) => ({ [name]: _.includes(user.users_follow, name) })) };
};
