const UserWobjects = require('models/UserWobjects');
const _ = require('lodash');

const makePipeline = ({
  // eslint-disable-next-line camelcase
  name, skip, limit, object_types, exclude_object_types,
}) => {
  const pipeline = [
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

  // eslint-disable-next-line camelcase
  if (object_types || exclude_object_types) {
    pipeline.splice(4, 0, {
      // eslint-disable-next-line camelcase
      $match: { 'wobject.object_type': object_types ? { $in: object_types } : { $nin: exclude_object_types } },
    });
  }
  return pipeline;
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
  } = await UserWobjects.aggregate(makePipeline(data));

  if (userWobjectsError) {
    return { error: userWobjectsError };
  }
  wobjects.forEach((wObject) => {
    wObject.fields = _.filter(wObject.fields, (field) => _.includes(['name', 'avatar', 'parent'], field.name));
  });

  return {
    objects_shares:
      {
        wobjects: wobjects.slice(0, data.limit),
        hasMore: wobjects.length > data.limit,
      },
  };
};

const getUserObjectsSharesCounters = async (name) => {
  const { result: [countHashtag = { count: 0 }], error: hashtagErr } = await UserWobjects
    .aggregate(makeCountPipeline({ name, object_types: ['hashtag'] }));
  const { result: [countWobj = { count: 0 }], error: wobjErr } = await UserWobjects
    .aggregate(makeCountPipeline({ name, exclude_object_types: ['hashtag'] }));

  if (hashtagErr || wobjErr) return { error: hashtagErr || wobjErr };

  return {
    hashtagsExpCount: countHashtag.count,
    wobjectsExpCount: countWobj.count,
  };
};

module.exports = { getUserObjectsShares, getUserObjectsSharesCounters };
