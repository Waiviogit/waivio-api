const { User } = require('models');
const _ = require('lodash');

const makeCountPipeline = ({ string }) => [
  { $match: { name: { $in: [new RegExp(`^waivio_${string}`), new RegExp(`^${string}`)] } } },
  { $count: 'count' },
];

exports.searchUsers = async ({ string, limit, skip }) => {
  const { user } = await User.findOneByCondition(
    { name: { $in: [`waivio_${string}`, `^${string}`] } },
  );
  const { users, error } = await User.search({ string, skip, limit });
  const {
    result: [
      { count: usersCount = 0 } = {}] = [], error: countError,
  } = await User.aggregate(makeCountPipeline({ string }));
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
