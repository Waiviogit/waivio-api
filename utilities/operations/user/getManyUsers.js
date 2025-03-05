const _ = require('lodash');
const { User, Subscriptions } = require('../../../models');

const getUsers = async ({ limit, skip, sample }) => {
  if (sample) limit = 100;

  const { usersData: users, error } = await User.find({
    condition: { last_posts_count: { $gt: 0 } },
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
    if (data.name) {
      const { users } = await Subscriptions.findOne({ follower: user.name, following: data.name });
      user.followsMe = !!users;
    }
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
