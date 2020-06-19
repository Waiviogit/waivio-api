const _ = require('lodash');
const { User, Subscriptions } = require('models');

exports.getAll = async ({ name, skip, limit }) => {
  const { users, error } = await Subscriptions
    .getFollowings({ follower: name, skip, limit: limit + 1 });
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
    }))
    .slice(0, limit)
    .value();

  return { result: { users: result, hasMore: users.length === limit + 1 } };
};

// returns collection of users or permlinks with boolean markers
exports.getFollowingsArray = async (data) => {
  const { user, error } = await User.getOne(data.name);
  if (error) return { error: { status: 503, message: error.message } };

  const { users, subscriptionError } = await Subscriptions
    .getFollowings({ follower: data.name, limit: -1 });
  if (subscriptionError) return { error: { status: 503, message: subscriptionError.message } };

  if (data.users) {
    if (!users.length) {
      return {
        users: _.map(data.users, (name) => ({ [name]: false })),
      };
    }
    return {
      users: _.map(data.users,
        (name) => ({ [name]: _.includes(users, name) })),
    };
  } if (data.permlinks) {
    if (!user) return { users: _.map(data.permlinks, (permlink) => ({ [permlink]: false })) };
    return {
      users: _.map(data.permlinks,
        (permlink) => ({ [permlink]: _.includes(user.objects_follow, permlink) })),
    };
  }
};
