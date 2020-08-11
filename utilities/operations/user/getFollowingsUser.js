const _ = require('lodash');
const { User, Subscriptions } = require('models');
const { followersHelper } = require('utilities/helpers');

exports.getAll = async ({
  name, skip, limit, sort,
}) => {
  const result = await followersHelper.sortUsers({
    field: 'follower', name, limit: limit + 1, skip, sort,
  });
  const hasMore = result.length === limit + 1;
  result.pop();

  return { result: { users: result, hasMore } };
};

// returns collection of users or permlinks with boolean markers
exports.getFollowingsArray = async (data) => {
  const { user, error } = await User.getOne(data.name);
  if (error) return { error: { status: 503, message: error.message } };
  const { subscriptionData, error: subscriptionError } = await Subscriptions
    .find({ condition: { follower: data.name, following: { $in: data.users } } });

  if (subscriptionError) return { error: { status: 503, message: subscriptionError.message } };
  const users = _.map(subscriptionData, 'following');

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
