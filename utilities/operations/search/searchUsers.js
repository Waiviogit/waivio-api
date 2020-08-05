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
  const { user } = await User.findOneByCondition(
    { name: { $in: [`waivio_${string}`, string] } },
  );
  const { users, error } = await User.search({ string, skip, limit, notGuest });
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
      })), limit),
    usersCount,
    error: error || countError,
  };
};
