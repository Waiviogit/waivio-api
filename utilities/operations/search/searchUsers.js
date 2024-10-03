const { User } = require('models');
const _ = require('lodash');

const makeCountPipeline = ({ string, notGuest }) => {
  const pipeline = [
    { $match: { name: { $in: [new RegExp(`^waivio_${string}`), new RegExp(`^${string}`)] } } },
    { $count: 'count' },
  ];
  if (notGuest) pipeline[0].$match.auth = { $exists: false };
  return pipeline;
};

exports.searchUsers = async ({
  string, limit, skip, notGuest = false,
}) => {
  if (!string) return getAllUsers({ skip, limit });

  const condition = { name: { $in: [`waivio_${string}`, string] } };
  string = string.replace(/[^a-zA-Z0-9._-]/g, '');
  string = string.replace(/\./g, '\\.');
  if (notGuest) condition.auth = { $exists: false };
  const { user } = await User.findOneByCondition(condition);
  const { users, error } = await User.search({
    string, skip, limit: limit + 1, notGuest,
  });
  const {
    result: [
      { count: usersCount = 0 } = {}] = [], error: countError,
  } = await User.aggregate(makeCountPipeline({ string, notGuest }));
  if (user && users.length) {
    _.remove(users, (person) => user.name === person.name);
    users.splice(0, 0, user);
  }
  return {
    users: _.take(users.map((u) => (
      {
        account: u.name,
        wobjects_weight: u.wobjects_weight,
        followers_count: u.followers_count,
        posting_json_metadata: u.posting_json_metadata,
      })), limit),
    usersCount,
    error: error || countError,
    hasMore: users.length > limit,
  };
};

const getAllUsers = async ({ skip, limit }) => {
  const { usersData: users } = await User.find({
    condition: {},
    sort: { wobjects_weight: -1 },
    limit: limit + 1,
    skip,
    select: { name: 1, followers_count: 1, wobjects_weight: 1 },
  });
  return {
    users: _.take(_.map(users, (u) => (
      {
        account: u.name,
        wobjects_weight: u.wobjects_weight,
        followers_count: u.followers_count,
      })), limit),
    hasMore: users.length > limit,
  };
};
