const _ = require('lodash');
const { FIELDS_NAMES, SEARCH_FIELDS } = require('constants/wobjectsData');
const { Wobj, App } = require('models');
const { getNamespace } = require('cls-hooked');

exports.searchWobjects = async ({
  // eslint-disable-next-line camelcase
  string, object_type, limit, skip, app, forParent, required_fields, needCounters = false,
}) => {
  if (!app) {
    const session = getNamespace('request-session');
    const host = session.get('host');
    ({ result: app } = await App.findOne({ host }));
  }

  const crucialWobjects = _.get(app, 'supported_objects', []);
  const forSites = crucialWobjects.length && (app.inherited || app.canBeExtended);
  const authorities = _.get(app, 'authority', []);
  const supportedTypes = _.get(app, 'supported_object_types', []);

  const pipeline = getPipeline({
    forSites,
    crucialWobjects,
    authorities,
    string,
    limit,
    skip,
    forParent,
    object_type,
    supportedTypes,
    required_fields,
  });

  const { wobjects = [], error: getWobjError } = await Wobj.fromAggregation(pipeline);
  const wobject = _.find(wobjects, { author_permlink: string });

  if (wobject && wobjects.length) {
    _.remove(wobjects, (wobj) => wobject.author_permlink === wobj.author_permlink);
    wobjects.splice(0, 0, wobject);
  }

  if (needCounters && !getWobjError) {
    const {
      wobjects: wobjectsCounts,
      error: getWobjCountError,
    } = await Wobj.fromAggregation(makeCountPipeline({
      string, crucialWobjects, authorities, object_type, forSites, supportedTypes,
    }));
    return {
      wobjects: _.take(wobjects, limit),
      wobjectsCounts,
      error: getWobjCountError,
    };
  }

  return {
    wobjects: _.take(wobjects, limit),
    error: getWobjError,
  };
};

const getPipeline = ({
  forSites, crucialWobjects, authorities, string, limit,
  skip, forParent, object_type, supportedTypes, required_fields,
}) => (forSites
  ? addFieldsToSearch({
    crucialWobjects, authorities, string, limit, skip, forParent, object_type, supportedTypes,
  })
  : makePipeline({
    string, object_type, limit, skip, crucialWobjects, forParent, required_fields,
  }));

const addFieldsToSearch = ({
  crucialWobjects, string, authorities, object_type, forParent, skip, limit, supportedTypes,
}) => [
  ...matchSitesPipe({
    string, authorities, crucialWobjects, object_type, supportedTypes,
  }),
  {
    $addFields: {
      priority: { $cond: { if: { $eq: ['$parent', forParent] }, then: 1, else: 0 } },
    },
  },
  { $sort: { priority: -1, weight: -1 } },
  { $limit: limit || 10 },
  { $skip: skip || 0 },
];

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

const makeCountPipeline = ({
  string, forSites, authorities, crucialWobjects, object_type, supportedTypes,
}) => {
  const pipeline = [
    { $group: { _id: '$object_type', count: { $sum: 1 } } },
    { $project: { _id: 0, object_type: '$_id', count: 1 } },
  ];
  if (forSites) {
    pipeline.unshift(...matchSitesPipe({
      string, authorities, crucialWobjects, object_type, supportedTypes,
    }));
  } else {
    pipeline.unshift({
      $match: {
        $or: [
          { fields: { $elemMatch: { name: 'name', body: { $regex: string, $options: 'i' } } } },
          { author_permlink: { $regex: `${_.get(string, '[3]') === '-' ? `^${string}` : '_'}`, $options: 'i' } },
        ],
        'status.title': { $nin: ['unavailable', 'nsfw', 'relisted'] },
      },
    });
  }
  return pipeline;
};

const matchSitesPipe = ({
  authorities, crucialWobjects, string, object_type, supportedTypes,
}) => [
  {
    $match: {
      $or: [{
        $expr: {
          $gt: [
            { $size: { $setIntersection: ['$authority.ownership', authorities] } },
            0,
          ],
        },
      }, {
        $expr: {
          $gt: [
            { $size: { $setIntersection: ['$authority.administrative', authorities] } },
            0,
          ],
        },
      },
      { author_permlink: { $in: crucialWobjects } },
      ],
      object_type: { $in: supportedTypes },
      'status.title': { $nin: ['unavailable', 'nsfw', 'relisted'] },
    },
  },
  {
    $match: {
      $and: [
        {
          $or: [
            { author_permlink: { $regex: `${_.get(string, '[3]') === '-' ? `^${string}` : '_'}`, $options: 'i' } },
            { fields: { $elemMatch: { name: { $in: SEARCH_FIELDS }, body: { $regex: string, $options: 'i' } } } },
          ],
        },
        // eslint-disable-next-line camelcase
        { object_type: { $regex: `^${object_type || '.*'}$`, $options: 'i' } },
      ],
    },
  },
];
