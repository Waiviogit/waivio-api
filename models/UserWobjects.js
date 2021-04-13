const _ = require('lodash');
const { UserWobjects } = require('database').models;
const { EXPERTS_SORT } = require('constants/sortData');

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

const getByWobject = async (data) => {
  switch (data.sort) {
    case EXPERTS_SORT.RANK:
      return getExpertsWithoutMergingCollections({ ...data, sort: { $sort: { weight: -1 } } });
    case EXPERTS_SORT.ALPHABET:
      return getExpertsWithoutMergingCollections({ ...data, sort: { $sort: { name: -1 } } });
    case EXPERTS_SORT.FOLLOWERS:
      return getExpertsByFollowers({ ...data });
    case EXPERTS_SORT.RECENCY:
      return getExpertsWithoutMergingCollections({ ...data, sort: { $sort: { _id: -1 } } });
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
    { $project: { _id: 0, name: '$user_name', weight: 1 } },
  ];

  if (username) pipeline[0].$match.user_name = username;
  if (weight) pipeline[0].$match.weight = { $gt: 0 };
  try {
    return { experts: await UserWobjects.aggregate(pipeline) };
  } catch (error) {
    return { error };
  }
};

const getExpertsByFollowers = async ({
  authorPermlink, skip = 0, limit = 30,
}) => {
  try {
    const userWobjWithFollowersCount = await UserWobjects
      .find({ author_permlink: authorPermlink })
      .select('user_name')
      .skip(skip)
      .limit(limit)
      .populate({ path: 'full_user', select: { followers_count: 1, _id: 0 } })
      .lean();

    const result = _.orderBy(
      userWobjWithFollowersCount, ['user_followers_count.followers_count'], ['desc'],
    );
    return { experts: result };
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
  getByWobject,
  countDocuments,
};
