const _ = require('lodash');
const { User } = require('models');

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
  let hasMore = false;
  const { usersData, error } = await User.find(
    { name: { $in: data.users } }, data.skip, data.limit + 1,
  );
  if (error) return { error };
  if (data.limit < usersData.length) hasMore = true;
  return {
    data: {
      users: _.take(_.map(usersData, (user) => _.omit(user, ['auth'])), data.limit),
      hasMore,
    },
  };
};

module.exports = { getUsers, getUsersByList };
