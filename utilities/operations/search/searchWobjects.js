const _ = require('lodash');
const { FIELDS_NAMES, SEARCH_FIELDS } = require('constants/wobjectsData');
const { Wobj } = require('models');
const { getSessionApp } = require('utilities/helpers/sitesHelper');

exports.searchWobjects = async ({
  // eslint-disable-next-line camelcase
  string, object_type, limit, skip, app, forParent, required_fields, needCounters = false,
}) => {
  if (!app) ({ result: app } = await getSessionApp());

  const crucialWobjects = _.get(app, 'supported_objects', []);
  const forSites = app.inherited;
  const forExtended = app.canBeExtended;
  const authorities = _.get(app, 'authority', []);
  const supportedTypes = _.get(app, 'supported_object_types', []);

  const pipeline = getPipeline({
    forExtended,
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

  const { wObject } = await Wobj.getOne(string, object_type, true);

  if (wObject && wobjects.length) {
    _.remove(wobjects, (wobj) => wObject.author_permlink === wobj.author_permlink);
    wobjects.splice(0, 0, wObject);
  }

  if (needCounters && !getWobjError) {
    const {
      wobjects: wobjectsCounts,
      error: getWobjCountError,
    } = await Wobj.fromAggregation(makeCountPipeline({
      string, crucialWobjects, authorities, object_type, forSites, supportedTypes, forExtended,
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
  forSites, crucialWobjects, authorities, string, limit, forExtended,
  skip, forParent, object_type, supportedTypes, required_fields,
}) => (forSites || forExtended
  ? addFieldsToSearch({
    forSites,
    crucialWobjects,
    authorities,
    string,
    limit,
    skip,
    forParent,
    object_type,
    supportedTypes,
  })
  : makePipeline({
    string, object_type, limit, skip, crucialWobjects, forParent, required_fields,
  }));

/** If forParent object exist - add checkField for primary sorting, else sort by weight */
const addFieldsToSearch = ({
  crucialWobjects, string, authorities, object_type, forParent, skip, limit, supportedTypes, forSites,
}) => {
  const pipeline = [...matchSitesPipe({
    string, authorities, crucialWobjects, object_type, supportedTypes, forSites,
  })];
  if (forParent) {
    pipeline.push({
      $addFields: {
        priority: { $cond: { if: { $eq: ['$parent', forParent] }, then: 1, else: 0 } },
      },
    }, { $sort: { priority: -1, weight: -1 } });
  } else pipeline.push({ $sort: { weight: -1 } });

  pipeline.push({ $limit: limit || 10 }, { $skip: skip || 0 });
  return pipeline;
};

/** Search pipe for basic websites, which cannot be extended and not inherited */
const makePipeline = ({
  // eslint-disable-next-line camelcase
  string, object_type, limit, skip, crucialWobjects, forParent,
}) => {
  const pipeline = [matchSimplePipe({ string, object_type })];
  if (_.get(crucialWobjects, 'length') || forParent) {
    pipeline.push({
      $addFields: {
        // eslint-disable-next-line camelcase
        crucial_wobject: { $cond: { if: { $in: ['$author_permlink', crucialWobjects] }, then: 1, else: 0 } },
        priority: { $cond: { if: { $eq: ['$parent', forParent] }, then: 1, else: 0 } },
      },
    },
    { $sort: { crucial_wobject: -1, priority: -1, weight: -1 } });
  } else pipeline.push({ $sort: { weight: -1 } });
  pipeline.push({ $limit: limit || 10 }, { $skip: skip || 0 });

  return pipeline;
};

const makeCountPipeline = ({
  string, forSites, authorities, crucialWobjects, object_type, supportedTypes, forExtended,
}) => {
  const pipeline = [
    { $group: { _id: '$object_type', count: { $sum: 1 } } },
    { $project: { _id: 0, object_type: '$_id', count: 1 } },
  ];
  if (forSites || forExtended) {
    pipeline.unshift(...matchSitesPipe({
      string, authorities, crucialWobjects, object_type, supportedTypes, forSites,
    }));
  } else {
    pipeline.unshift(matchSimplePipe({ string, object_type }));
  }
  return pipeline;
};

/** If search request for custm sites - find objects only by authorities and supported objects,
 * if app can be extended - search objects by supported object types */
const matchSitesPipe = ({
  authorities, crucialWobjects, string, object_type, supportedTypes, forSites,
}) => {
  const pipeline = [];
  if (forSites) {
    pipeline.push({
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
    });
  } else {
    pipeline.push({
      $match: {
        object_type: { $in: supportedTypes },
        'status.title': { $nin: ['unavailable', 'nsfw', 'relisted'] },
      },
    });
  }
  pipeline.push({
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
  });
  return pipeline;
};

const matchSimplePipe = ({ string, object_type }) => ({
  $match: {
    $and: [
      {
        $or: [
          { fields: { $elemMatch: { name: FIELDS_NAMES.NAME, body: { $regex: string, $options: 'i' } } } },
          { author_permlink: { $regex: `${_.get(string, '[3]') === '-' ? `^${string}` : '_'}`, $options: 'i' } },
        ],
      },
      { object_type: { $regex: `^${object_type || '.*'}$`, $options: 'i' } },
    ],
    'status.title': { $nin: ['unavailable', 'nsfw', 'relisted'] },
  },
});
