const _ = require('lodash');
const { WObject } = require('database').models;
const { User, Subscriptions } = require('models');

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

const sortUsers = async ({
  field, name, limit, skip, sort,
}) => {
  const localField = field === 'follower' ? 'following' : 'follower';
  let sortBy = null;

  switch (sort) {
    case 'recency':
      sortBy = { _id: -1 };
      break;
    case 'rank':
      sortBy = { wobjects_weight: -1 };
      break;
    case 'followers':
      sortBy = { followers_count: -1 };
      break;
    case 'alphabet':
      sortBy = { [`${localField}`]: 1 };
      break;
  }

  const recencyAndAlphabet = [
    { $match: { [`${field}`]: name } },
    { $sort: sortBy },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField,
        foreignField: 'name',
        as: 'user',
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: `$${localField}`,
        wobjects_weight: '$user.wobjects_weight',
        followers_count: '$user.followers_count',
      },
    },
  ];

  const rankAndFollowers = [
    { $match: { [`${field}`]: name } },
    {
      $lookup: {
        from: 'users',
        localField,
        foreignField: 'name',
        as: 'user',
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: `$${localField}`,
        wobjects_weight: '$user.wobjects_weight',
        followers_count: '$user.followers_count',
      },
    },
    { $sort: sortBy },
    { $skip: skip },
    { $limit: limit },
  ];
  const pipeline = sort === 'alphabet' || sort === 'recency' ? recencyAndAlphabet : rankAndFollowers;
  const { users } = await Subscriptions.aggregate({ pipeline });
  return users;
};

module.exports = {
  getFollowers, sortUsers,
};
