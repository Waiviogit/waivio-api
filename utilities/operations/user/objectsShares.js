/* eslint-disable camelcase */
const UserExpertiseModel = require('models/UserExpertiseModel');
const _ = require('lodash');

const makePipeline = ({
  name, skip, limit, object_types, exclude_object_types,
}) => {
  if (object_types || exclude_object_types) {
    return [
      { $match: { user_name: name, weight: { $gt: 0 } } },
      { $sort: { weight: -1 } },
      {
        $lookup: {
          from: 'wobjects',
          localField: 'author_permlink',
          foreignField: 'author_permlink',
          as: 'wobject',
        },
      },
      { $unwind: '$wobject' },
      { $match: { 'wobject.object_type': object_types ? { $in: object_types } : { $nin: exclude_object_types } } },
      {
        $lookup: {
          from: 'wobject_tokens',
          localField: 'author_permlink',
          foreignField: 'author_permlink',
          as: 'excluded',
        },
      },
      { $match: { excluded: { $size: 0 } } },
      { $skip: skip },
      { $limit: limit + 1 },
      {
        $addFields: {
          'wobject.user_weight': '$weight',
        },
      },
      { $replaceRoot: { newRoot: '$wobject' } },
      {
        $lookup: {
          from: 'wobjects',
          localField: 'parent',
          foreignField: 'author_permlink',
          as: 'parent',
        },
      },
      { $addFields: { parent: { $ifNull: [{ $arrayElemAt: ['$parent', 0] }, ''] } } },
    ];
  }

  return [
    { $match: { user_name: name, weight: { $gt: 0 } } },
    { $sort: { weight: -1 } },
    { $skip: skip },
    { $limit: limit + 1 },
    {
      $lookup: {
        from: 'wobjects',
        localField: 'author_permlink',
        foreignField: 'author_permlink',
        as: 'wobject',
      },
    },
    { $unwind: '$wobject' },
    {
      $addFields: {
        'wobject.user_weight': '$weight',
      },
    },
    { $replaceRoot: { newRoot: '$wobject' } },
    {
      $lookup: {
        from: 'wobjects',
        localField: 'parent',
        foreignField: 'author_permlink',
        as: 'parent',
      },
    },
    { $addFields: { parent: { $ifNull: [{ $arrayElemAt: ['$parent', 0] }, ''] } } },
  ];
};

// eslint-disable-next-line camelcase
const makeCountPipeline = ({ name, object_types, exclude_object_types }) => {
  const pipeline = [
    { $match: { user_name: name, weight: { $gt: 0 } } },
    {
      $lookup: {
        from: 'wobjects',
        localField: 'author_permlink',
        foreignField: 'author_permlink',
        as: 'wobject',
      },
    },
    { $unwind: '$wobject' },
    {
      $count: 'count',
    },
  ];

  // eslint-disable-next-line camelcase
  if (object_types || exclude_object_types) {
    pipeline.splice(3, 0, {
      // eslint-disable-next-line camelcase
      $match: { 'wobject.object_type': object_types ? { $in: object_types } : { $nin: exclude_object_types } },
    });
  }
  return pipeline;
};

const getUserObjectsShares = async (data) => {
  const {
    result: wobjects,
    error: userWobjectsError,
  } = await UserExpertiseModel.aggregate(makePipeline(data));

  if (userWobjectsError) {
    return { error: userWobjectsError };
  }
  wobjects.forEach((wObject) => {
    wObject.fields = _.filter(wObject.fields, (field) => _.includes(['name', 'avatar', 'parent'], field.name));
  });

  return {
    objects_shares:
      {
        wobjects: _.take(wobjects, data.limit),
        hasMore: wobjects.length > data.limit,
      },
  };
};

const getUserObjectsSharesCounters = async (name) => {
  const { result: [countHashtag = { count: 0 }], error: hashtagErr } = await UserExpertiseModel
    .aggregate(makeCountPipeline({ name, object_types: ['hashtag'] }));
  const { result: [countWobj = { count: 0 }], error: wobjErr } = await UserExpertiseModel
    .aggregate(makeCountPipeline({ name, exclude_object_types: ['hashtag'] }));

  if (hashtagErr || wobjErr) return { error: hashtagErr || wobjErr };

  return {
    hashtagsExpCount: countHashtag.count,
    wobjectsExpCount: countWobj.count,
  };
};

module.exports = { getUserObjectsShares, getUserObjectsSharesCounters };
