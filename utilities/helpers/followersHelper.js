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

const sortUsers = ({
  sort, skip, limit, usersData, users,
}) => {
  const recency = _.map(users, (el) => ({
    name: el.follower || el.following,
    timestamp: new Date(
      parseInt(el._id.toString().substring(0, 8), 16) * 1000,
    ).valueOf(),
  }));
  const result = _
    .chain(usersData)
    .map((user) => ({
      name: user.name,
      wobjects_weight: user.wobjects_weight,
      followers_count: user.followers_count,
    }))
    .value();
  _.forEach(result, (el) => {
    for (const merge of recency) {
      if (el.name === merge.name) {
        el.timestamp = merge.timestamp;
      }
    }
  });
  switch (sort) {
    case 'rank':
      return _.chain(result).orderBy(['wobjects_weight'], 'desc').slice(skip, limit + skip).value();
    case 'alphabet':
      return _.chain(result).orderBy(['name'], 'asc').slice(skip, limit + skip).value();
    case 'followers':
      return _.chain(result).orderBy(['followers_count'], 'desc').slice(skip, limit + skip).value();
    case 'recency':
      return _.chain(result).orderBy(['timestamp'], 'desc').slice(skip, limit + skip).value();
  }
};

module.exports = { getFollowers, sortUsers };
