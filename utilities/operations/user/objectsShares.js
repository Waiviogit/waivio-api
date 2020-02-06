const UserWobjects = require('models/UserWobjects');
const { REQUIREDFIELDS } = require('utilities/constants');
const { wObjectHelper } = require('utilities/helpers');

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
    { $limit: limit },
    {
      $addFields: {
        'wobject.user_weight': '$weight',
      },
    },
    { $replaceRoot: { newRoot: '$wobject' } },
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

  // eslint-disable-next-line camelcase
  const required_fields = [...REQUIREDFIELDS];
  const fields = required_fields.map((item) => ({ name: item }));

  wobjects.forEach((wObject) => {
    wObjectHelper.formatRequireFields(wObject, data.locale, fields);
  });
  const {
    result:
      [countResult = { count: 0 }] = [], error,
  } = await UserWobjects.aggregate(makeCountPipeline(data));

  if (error) {
    return { error };
  }

  return { objects_shares: { wobjects, wobjects_count: countResult.count } };
};

module.exports = { getUserObjectsShares };
