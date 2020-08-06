const _ = require('lodash');
const { WObject } = require('database').models;
const { User } = require('models');

const getFollowers = async (data) => {
  try {
    const wObject = await WObject.findOne({ author_permlink: data.author_permlink })
      .populate({
        path: 'followers',
        options: {
          limit: data.limit,
          sort: { name: 1 },
          skip: data.skip,
          select: 'name',
        },
      })
      .lean();

    return { followers: await formatWobjectFollowers(wObject) };
  } catch (error) {
    return { error };
  }
};

const formatWobjectFollowers = async (wObject) => {
  if (!wObject.followers.length) return [];
  const followers = _.map(wObject.followers, 'name');
  const { result } = await User.aggregate([
    { $match: { name: { $in: followers } } },
    { $addFields: { weight: '$wobjects_weight' } },
    { $project: { _id: 0, name: 1, weight: 1 } },
  ]);
  if (result) return result;
  return [];
};

const preSort = ({
  sort, limit, skip, users,
}) => {
  switch (sort) {
    case 'rank':
    case 'followers':
      return { users };
    case 'alphabet':
      return { users: _.chain(users).orderBy(['follower', 'following'], 'asc').slice(skip, limit + skip).value() };
    case 'recency':
      const addTimestamp = _.map(users, (el) => ({
        ...el, timestamp: el._id.getTimestamp().valueOf(),
      }));

      return { users: _.chain(addTimestamp).orderBy(['timestamp'], 'desc').slice(skip, limit + skip).value() };
  }
};

const postSort = ({
  sort, skip, limit, usersData, preSorted,
}) => {
  const result = _
    .chain(usersData)
    .map((user) => ({
      name: user.name,
      wobjects_weight: user.wobjects_weight,
      followers_count: user.followers_count,
    }))
    .value();

  switch (sort) {
    case 'rank':
      return _.chain(result).orderBy(['wobjects_weight'], 'desc').slice(skip, limit + skip).value();
    case 'alphabet':
      return _.orderBy(result, ['name'], 'asc');
    case 'followers':
      return _.chain(result).orderBy(['followers_count'], 'desc').slice(skip, limit + skip).value();
    case 'recency':
      _.forEach(result, (el) => {
        el.timestamp = _.find(preSorted, (user) => user.name === preSorted.name).timestamp;
      });
      return _.orderBy(result, ['timestamp'], 'desc');
  }
};

module.exports = { getFollowers, postSort, preSort };
