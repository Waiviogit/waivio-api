const _ = require('lodash');
const { User, Subscriptions } = require('models');
const { followersHelper } = require('utilities/helpers');

exports.getAll = async ({
  name, skip, limit, sort,
}) => {
  const { users, error } = await Subscriptions
    .getFollowings({
      follower: name, skip: 0, limit: 0, withId: true,
    });
  if (error) return { error };
  if (!users.length) return { result: { users: [], hasMore: false } };
  const { users: preSorted } = followersHelper.preSort({
    sort, limit: limit + 1, skip, users,
  });
  const { usersData, error: usersError } = await User.find({
    condition: { name: { $in: _.map(preSorted, 'following') } },
    select: { name: 1, wobjects_weight: 1, followers_count: 1 },
  });
  if (usersError) return { error: usersError };

  const postSorted = followersHelper.sortUsers({
    sort, skip, limit: limit + 1, usersData, preSorted,
  });

  const result = [...postSorted];
  result.pop();

  return { result: { users: result, hasMore: postSorted.length === limit + 1 } };
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
