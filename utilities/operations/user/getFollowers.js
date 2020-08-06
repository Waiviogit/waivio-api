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
  const { usersData, error: usersError } = await User.find(
    { condition: { name: { $in: _.map(users, 'follower') } } },
  );
  if (usersError) return { error: usersError };

  const result = followersHelper.sortUsers({
    sort, skip, limit, usersData, users,
  });

  return { result: { followers: result, hasMore: users.length === limit + 1 } };
};
