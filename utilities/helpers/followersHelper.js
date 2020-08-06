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
  sort, limit, usersData, users,
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
    .slice(0, limit)
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
      return _.orderBy(result, ['wobjects_weight'], 'desc');
    case 'alphabet':
      return _.orderBy(result, ['name'], 'asc');
    case 'followers':
      return _.orderBy(result, ['followers_count'], 'desc');
    case 'recency':
      return _.orderBy(result, ['timestamp'], 'desc');
  }
};

module.exports = { getFollowers, sortUsers };
