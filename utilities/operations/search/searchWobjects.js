const _ = require('lodash');
const { REQUIREDFIELDS_SEARCH } = require('utilities/constants');
const { Wobj, App } = require('models');

const makePipeline = ({
  // eslint-disable-next-line camelcase
  string, object_type, limit, skip, crucialWobjects, forParent, required_fields,
}) => [
  {
    $match: {
      $and: [
        {
          $or: [
            // search matching in every "name" field
            { fields: { $elemMatch: { name: 'name', body: { $regex: `\\b${string}.*\\b`, $options: 'i' } } } },
            // if 4-th symbol is "-" - search by "author_permlink" too
            { author_permlink: { $regex: `${_.get(string, '[3]') === '-' ? `^${string}` : '_'}`, $options: 'i' } },
          ],
        },
        // eslint-disable-next-line camelcase
        { object_type: { $regex: `^${object_type || '.*'}$`, $options: 'i' } },
      ],
      'status.title': { $nin: ['unavailable'] },
    },
  },
  {
    $addFields: {
      // eslint-disable-next-line camelcase
      crucial_wobject: { $cond: { if: { $in: ['$author_permlink', crucialWobjects] }, then: 1, else: 0 } },
      priority: { $cond: { if: { $eq: ['$parent', forParent] }, then: 1, else: 0 } },
    },
  },
  { $sort: { crucial_wobject: -1, priority: -1, weight: -1 } },
  { $limit: limit || 10 },
  { $skip: skip || 0 },
  {
    $addFields: {
      fields: {
        $filter: {
          input: '$fields',
          as: 'field',
          cond: {
            // eslint-disable-next-line camelcase
            $in: ['$$field.name', _.union(REQUIREDFIELDS_SEARCH, required_fields || [])],
          },
        },
      },
    },
  },
  {
    $lookup: {
      from: 'wobjects',
      localField: 'parent',
      foreignField: 'author_permlink',
      as: 'parent',
    },
  },
  { $unwind: { path: '$parent', preserveNullAndEmptyArrays: true } },
];
const makeCountPipeline = ({ string }) => [
  {
    $match: {
      $or: [
        { fields: { $elemMatch: { name: 'name', body: { $regex: `\\b${string}.*\\b`, $options: 'i' } } } },
        { author_permlink: { $regex: `${_.get(string, '[3]') === '-' ? `^${string}` : '_'}`, $options: 'i' } },
      ],
      'status.title': { $nin: ['unavailable'] },
    },
  },
  { $group: { _id: '$object_type', count: { $sum: 1 } } },
  { $project: { _id: 0, object_type: '$_id', count: 1 } },
];

exports.searchWobjects = async ({
  // eslint-disable-next-line camelcase
  string, object_type, limit, skip, sortByApp, forParent, required_fields,
}) => {
  // get count of wobjects grouped by object_types
  const {
    wobjects: wobjectsCounts,
    error: getWobjCountError,
  } = await Wobj.fromAggregation(makeCountPipeline({ string }));
  let crucialWobjects = [];

  if (sortByApp) {
    // change priority for some wobjects by specified App
    const { app } = await App.getOne({ name: sortByApp });

    crucialWobjects = _.get(app, 'supported_objects');
  }
  // get wobjects
  const { wObject } = await Wobj.getOne(string, object_type, true);
  const { wobjects = [], error: getWobjError } = await Wobj.fromAggregation(makePipeline({
    string, object_type, limit, skip, crucialWobjects, forParent, required_fields,
  }));
  if (wObject && wobjects.length) {
    _.remove(wobjects, (wobj) => wObject.author_permlink === wobj.author_permlink);
    wobjects.splice(0, 0, wObject);
  }
  return {
    wobjects: _.take(wobjects, limit),
    wobjectsCounts,
    error: getWobjCountError || getWobjError,
  };
};
