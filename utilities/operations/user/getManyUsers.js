const _ = require('lodash');
const { User, Subscriptions } = require('models');

const getUsers = async ({ limit, skip, sample }) => {
  if (sample) limit = 100;

  const { usersData: users, error } = await User.find({
    condition: {},
    sort: { wobjects_weight: -1 },
    limit,
    skip,
    select: {
      name: 1, followers_count: 1, posting_json_metadata: 1, wobjects_weight: 1,
    },
  });
  if (error) return { error };

  return { users: sample ? _.sampleSize(users, 5) : users };
};

const getUsersByList = async (data) => {
  const { usersData, error } = await User.find({
    condition: { name: { $in: data.users } },
    skip: data.skip,
    limit: data.limit + 1,
    sort: { wobjects_weight: -1 },
  });
  if (error) return { error };
  const mappedUsers = [];
  for (const user of usersData) {
    const { users } = await Subscriptions.getFollowings({ follower: user.name, limit: 0 });
    user.users_follow = users || [];
    if (data.name) user.followsMe = _.includes(users || [], data.name);
    mappedUsers.push(user);
  }
  return {
    data: {
      users: _.take(mappedUsers, data.limit),
      hasMore: data.limit < usersData.length,
    },
  };
};

module.exports = { getUsers, getUsersByList };
