const _ = require('lodash');
const { User, Subscriptions } = require('models');
const { followersHelper } = require('utilities/helpers');

module.exports = async ({
  name, skip, limit, sort,
}) => {
  const { users, error } = await Subscriptions.getFollowers({
    following: name, skip: 0, limit: 0, withId: true,
  });
  if (error) return { error };
  if (!users.length) return { result: { followers: [], hasMore: false } };
  const { users: preSorted } = followersHelper.preSort({
    sort, limit: limit + 1, skip, users,
  });
  const { usersData, error: usersError } = await User.find({
    condition: { name: { $in: _.map(preSorted, 'follower') } },
    select: { name: 1, wobjects_weight: 1, followers_count: 1 },
  });
  if (usersError) return { error: usersError };

  const result = followersHelper.sortUsers({
    sort, skip, limit: limit + 1, usersData, preSorted,
  });
  const hasMore = result.length === limit + 1;
  result.pop();

  return { result: { followers: result, hasMore } };
};
