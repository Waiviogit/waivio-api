const _ = require('lodash');
const { UserWobjects } = require('../database').models;

const aggregate = async (pipeline) => {
  try {
    const result = await UserWobjects.aggregate(pipeline);

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
    return { experts: await UserWobjects.aggregate(pipeline) };
  } catch (error) {
    return { error };
  }
};

const getExpertsByFollowersFromUserModel = async ({
  authorPermlink, skip = 0, limit = 30,
}) => {
  try {
    const usersWobjWithFollowersCount = await UserWobjects
      .find({ author_permlink: authorPermlink, weight: { $gt: 0 } })
      .select(['author_permlink', 'user_name', 'weight'])
      .populate({ path: 'full_user', select: { followers_count: 1, _id: 0 } })
      .lean();

    return {
      experts: _
        .chain(usersWobjWithFollowersCount)
        .orderBy(['full_user.followers_count'], ['desc'])
        .slice(skip, (limit + skip))
        .map((user) => ({
          _id: user._id,
          weight: user.weight,
          name: user.user_name,
          followers_count: _.get(user, 'full_user.followers_count', 0),
        }))
        .value(),
    };
  } catch (error) {
    return { error };
  }
};

const countDocuments = async (condition) => {
  try {
    return { count: await UserWobjects.countDocuments(condition) };
  } catch (error) {
    return { error };
  }
};

const findOne = async (condition, select) => {
  try {
    return { result: await UserWobjects.findOne(condition).select(select).lean() };
  } catch (error) {
    return { error };
  }
};

const find = async (condition, sort, limit) => {
  try {
    return { result: await UserWobjects.find(condition).sort(sort).limit(limit).lean() };
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
