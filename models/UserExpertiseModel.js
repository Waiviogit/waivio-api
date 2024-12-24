const _ = require('lodash');
const { UserExpertise } = require('database').models;

const aggregate = async (pipeline) => {
  try {
    const result = await UserExpertise.aggregate(pipeline);

    if (!result) {
      return { error: { status: 404, message: 'Not found!' } };
    }
    return { result };
  } catch (error) {
    return { error };
  }
};

const getExpertsWithoutMergingCollections = async ({
  authorPermlink, skip = 0, limit = 30, sort, username, weight,
}) => {
  const pipeline = [
    { $match: { author_permlink: authorPermlink } },
    sort,
    { $skip: skip },
    { $limit: limit },
    { $project: { _id: 1, name: '$user_name', weight: 1 } },
  ];

  if (username) pipeline[0].$match.user_name = username;
  if (weight) pipeline[0].$match.weight = { $gt: 0 };
  try {
    return { experts: await UserExpertise.aggregate(pipeline) };
  } catch (error) {
    return { error };
  }
};

const getExpertsByFollowersFromUserModel = async ({
  authorPermlink, skip = 0, limit = 30,
}) => {
  try {
    const pipeline = [
      { $match: { author_permlink: authorPermlink, weight: { $gt: 0 } } },
      {
        $lookup: {
          from: 'users',
          localField: 'user_name',
          foreignField: 'name',
          as: 'full_user_info',
        },
      },
      {
        $addFields: {
          followers_count: { $ifNull: [{ $arrayElemAt: ['$full_user_info.followers_count', 0] }, 0] },
        },
      },
      { $unset: 'full_user_info' },
      { $sort: { followers_count: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          weight: 1,
          name: '$user_name',
          followers_count: 1,
        },
      },
    ];

    const usersWobjWithFollowersCount = await UserExpertise.aggregate(pipeline);

    return { experts: usersWobjWithFollowersCount };
  } catch (error) {
    return { error };
  }
};

const countDocuments = async (condition) => {
  try {
    return { count: await UserExpertise.countDocuments(condition) };
  } catch (error) {
    return { error };
  }
};

const findOne = async (condition, select) => {
  try {
    return { result: await UserExpertise.findOne(condition).select(select).lean() };
  } catch (error) {
    return { error };
  }
};

const find = async (condition, sort, limit) => {
  try {
    return { result: await UserExpertise.find(condition).sort(sort).limit(limit).lean() };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  find,
  findOne,
  aggregate,
  countDocuments,
  getExpertsWithoutMergingCollections,
  getExpertsByFollowersFromUserModel,
};
