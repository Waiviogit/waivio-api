const _ = require('lodash');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const { Wobj, App } = require('models');
const { getNamespace } = require('cls-hooked');

exports.searchWobjects = async ({
  // eslint-disable-next-line camelcase
  string, object_type, limit, skip, crucialWobjects, forParent, required_fields,
}) => {
  // get count of wobjects grouped by object_types
  // const {
  //   wobjects: wobjectsCounts,
  //   error: getWobjCountError,
  // } = await Wobj.fromAggregation(makeCountPipeline({ string }));
  // let crucialWobjects = [];
  let app;
  if (!crucialWobjects) {
    const session = getNamespace('request-session');
    const host = session.get('host');
    // change priority for some wobjects by specified App
    ({ result: app } = await App.findOne({ host }));

    crucialWobjects = _.get(app, 'supported_objects', []);
  }
  // get wobjects
  const { wObject } = await Wobj.getOne(string, object_type, true);

  const pipeline = crucialWobjects
    ? addFieldsToSearch({
      crucialWobjects, authorities: _.get(app, 'authority'), string, limit, skip, forParent, object_type,
    })
    : makePipeline({
      string, object_type, limit, skip, crucialWobjects, forParent, required_fields,
    });

  const { wobjects = [], error: getWobjError } = await Wobj.fromAggregation(pipeline);
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

const addFieldsToSearch = ({
  crucialWobjects, string, authorities, object_type, forParent, skip, limit,
}) => [
  // { fields: { $elemMatch: { name: FIELDS_NAMES.ADDRESS, body: { $regex: string, $options: 'i' } } } },
  // { fields: { $elemMatch: { name: FIELDS_NAMES.TITLE, body: { $regex: string, $options: 'i' } } } },
  // { fields: { $elemMatch: { name: FIELDS_NAMES.DESCRIPTION, body: { $regex: string, $options: 'i' } } } },
  // { fields: { $elemMatch: { name: FIELDS_NAMES.CATEGORY_ITEM, body: { $regex: string, $options: 'i' } } } },
  {
    $project: {
      fields: 1,
      ownership: { $setIntersection: [authorities, '$authority.ownership'] },
      administrative: { $setIntersection: [authorities, '$authority.administrative'] },
      author_permlink: 1,
      object_type: 1,
    },
  },
  {
    $match: {
      $and: [{
        $or: [
          { author_permlink: { $regex: `${_.get(string, '[3]') === '-' ? `^${string}` : '_'}`, $options: 'i' } },
          { ownership: { $ne: { $size: 0 } } },
          { administrative: { $ne: { $size: 0 } } },
          { fields: { $elemMatch: { name: { $in: [FIELDS_NAMES.NAME, FIELDS_NAMES.ADDRESS] }, body: { $regex: string, $options: 'i' } } } },
        ],
      },

      // eslint-disable-next-line camelcase
      { object_type: { $regex: `^${object_type || '.*'}$`, $options: 'i' } },
      ],
      'status.title': { $nin: ['unavailable', 'nsfw', 'relisted'] },
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
  { $skip: skip || 0 }];

const makePipeline = ({
  // eslint-disable-next-line camelcase
  string, object_type, limit, skip, crucialWobjects, forParent,
}) => [
  {
    $match: {
      $and: [
        {
          $or: [{ fields: { $elemMatch: { name: FIELDS_NAMES.NAME, body: { $regex: string, $options: 'i' } } } },
            // if 4-th symbol is "-" - search by "author_permlink" too
            { author_permlink: { $regex: `${_.get(string, '[3]') === '-' ? `^${string}` : '_'}`, $options: 'i' } }],
        },
        // eslint-disable-next-line camelcase
        { object_type: { $regex: `^${object_type || '.*'}$`, $options: 'i' } },
      ],
      'status.title': { $nin: ['unavailable', 'nsfw', 'relisted'] },
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
];

const makeCountPipeline = ({ string }) => [
  {
    $match: {
      $or: [
        { fields: { $elemMatch: { name: 'name', body: { $regex: string, $options: 'i' } } } },
        { author_permlink: { $regex: `${_.get(string, '[3]') === '-' ? `^${string}` : '_'}`, $options: 'i' } },
      ],
      'status.title': { $nin: ['unavailable', 'nsfw', 'relisted'] },
    },
  },
  { $group: { _id: '$object_type', count: { $sum: 1 } } },
  { $project: { _id: 0, object_type: '$_id', count: 1 } },
];
