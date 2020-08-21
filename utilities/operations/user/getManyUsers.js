const _ = require('lodash');
const { User, Subscriptions } = require('models');

const makePipeline = ({ limit, skip, sample }) => {
  const pipeline = [
    { $sort: { wobjects_weight: -1 } },
    { $skip: sample ? 0 : skip },
    { $limit: sample ? 100 : limit },
    {
      $lookup: {
        from: 'subscriptions',
        localField: 'name',
        foreignField: 'follower',
        as: 'users_follow',
      },
    },
  ];

  if (sample) {
    pipeline.push({ $sample: { size: 5 } });
  }
  return pipeline;
};

/** This method has commented code from old logic, after check new logic - need to be removed */
const getUsers = async ({ limit, skip, sample }) => {
  // const pipeline = makePipeline({ limit, skip, sample });
  //
  // const { result: users, error } = await User.aggregate(pipeline);
  if (sample) {
    limit = 100;
  }
  const { usersData: users, error } = await User.find({
    condition: {},
    sort: { wobjects_weight: -1 },
    limit,
    skip,
    select: {
      name: 1, followers_count: 1, posting_json_metadata: 1, wobjects_weight: 1,
    },
  });
  if (error) {
    return { error };
  }
  return { users: sample ? _.sampleSize(users, 5) : users };
  // return { users: _.forEach(users, (user) => user.users_follow = _.map(user.users_follow, 'following')) };
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
