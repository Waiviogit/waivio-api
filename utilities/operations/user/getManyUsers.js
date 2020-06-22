const _ = require('lodash');
const { User, Subscriptions } = require('models');

const makePipeline = ({ limit, skip, sample }) => {
  const pipeline = [
    { $sort: { wobjects_weight: -1 } },
    { $skip: sample ? 0 : skip },
    { $limit: sample ? 100 : limit },
  ];

  if (sample) {
    pipeline.push({ $sample: { size: 5 } });
  }
  return pipeline;
};

const getUsers = async ({ limit, skip, sample }) => {
  const pipeline = makePipeline({ limit, skip, sample });
  const { result: users, error } = await User.aggregate(pipeline);

  if (error) {
    return { error };
  }
  return { users };
};

const getUsersByList = async (data) => {
  const { usersData, error } = await User.find(
    {
      condition: { name: { $in: data.users } },
      skip: data.skip,
      limit: data.limit + 1,
      sort: { wobjects_weight: -1 },
    },
  );
  if (error) return { error };

  return {
    data: {
      users: _.take(_.map(usersData, async (user) => {
        if (data.name) {
          const { users, error: subsError } = await Subscriptions
            .getFollowings({ follower: user.name, limit: -1 });
          subsError && console.error(subsError);
          user.followsMe = _.includes(users, data.name);
        }
        return user;
      }), data.limit),
      hasMore: data.limit < usersData.length,
    },
  };
};

module.exports = { getUsers, getUsersByList };
