const _ = require('lodash');
const { FIELDS_NAMES, SEARCH_FIELDS } = require('constants/wobjectsData');
const { Wobj, ObjectType, User } = require('models');
const { getSessionApp } = require('utilities/helpers/sitesHelper');
const { addCampaignsToWobjects } = require('utilities/helpers/campaignsHelper');

exports.searchWobjects = async ({
  // eslint-disable-next-line camelcase
  string, object_type, limit, skip, app, forParent, required_fields,
  needCounters = false, tagCategory, userName, simplified, map, sort,
}) => {
  if (!app) ({ result: app } = await getSessionApp());

  const crucialWobjects = _.get(app, 'supported_objects', []);
  const forSites = _.get(app, 'inherited');
  const forExtended = _.get(app, 'canBeExtended');
  const supportedTypes = _.get(app, 'supported_object_types', []);

  const pipeline = getPipeline({
    forExtended,
    tagCategory,
    forSites,
    crucialWobjects,
    string,
    sort,
    map,
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
    let {
      wobjects: wobjectsCounts,
      error: getWobjCountError,
    } = await Wobj.fromAggregation(makeCountPipeline({
      string, crucialWobjects, object_type, forSites, supportedTypes, forExtended,
    }));
    if (_.get(wobjectsCounts, 'length')) {
      wobjectsCounts = await fillTagCategories(wobjectsCounts);
    }
    return {
      wobjects: _.take(wobjects, limit),
      wobjectsCounts,
      error: getWobjCountError,
    };
  }
  /** Fill campaigns for some objects,
   * be careful, we pass objects by reference and in this method we will directly modify them */
  let user;
  if (userName) ({ user } = await User.getOne(userName));
  await addCampaignsToWobjects({
    wobjects, app, simplified, user,
  });
  return {
    wobjects: _.take(wobjects, limit),
    error: getWobjError,
  };
};

const fillTagCategories = async (wobjectsCounts) => {
  const { result: types } = await ObjectType.aggregate(
    [{ $match: { name: { $in: _.map(wobjectsCounts, 'object_type') } } }],
  );
  wobjectsCounts = wobjectsCounts.map((wobj) => {
    const objectType = _.find(types, { name: wobj.object_type });
    if (!_.get(objectType, 'supposed_updates')) {
      wobj.tagCategoties = [];
      return wobj;
    }
    const tagCategory = _.find(objectType.supposed_updates,
      { name: FIELDS_NAMES.TAG_CATEGORY });
    if (tagCategory) wobj.tagCategoties = tagCategory.values;
    return wobj;
  });
  return wobjectsCounts;
};

const getPipeline = ({
  forSites, crucialWobjects, string, limit, forExtended, map, sort,
  skip, forParent, object_type, supportedTypes, required_fields, tagCategory,
}) => (forSites || forExtended
  ? addFieldsToSearch({
    forSites,
    sort,
    map,
    crucialWobjects,
    tagCategory,
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
  crucialWobjects, string, object_type, forParent,
  skip, limit, supportedTypes, forSites, tagCategory, map, sort,
}) => {
  const pipeline = [...matchSitesPipe({
    string, crucialWobjects, object_type, supportedTypes, forSites, tagCategory, map,
  })];
  if (forParent) {
    pipeline.push({
      $addFields: {
        priority: { $cond: { if: { $eq: ['$parent', forParent] }, then: 1, else: 0 } },
      },
    }, { $sort: { priority: -1, [sort]: -1 } });
  } else pipeline.push({ $sort: { [sort]: -1 } });

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
  string, forSites, crucialWobjects, object_type, supportedTypes, forExtended,
}) => {
  const pipeline = [
    { $group: { _id: '$object_type', count: { $sum: 1 } } },
    { $project: { _id: 0, object_type: '$_id', count: 1 } },
  ];
  if (forSites || forExtended) {
    pipeline.unshift(...matchSitesPipe({
      string, crucialWobjects, object_type, supportedTypes, forSites,
    }));
  } else {
    pipeline.unshift(matchSimplePipe({ string, object_type }));
  }
  return pipeline;
};

/** If search request for custm sites - find objects only by authorities and supported objects,
 * if app can be extended - search objects by supported object types */
const matchSitesPipe = ({
  crucialWobjects, string, object_type, supportedTypes, forSites, tagCategory, map,
}) => {
  const pipeline = [];
  if (map) {
    pipeline.push({
      $geoNear: {
        near: { type: 'Point', coordinates: map.coordinates },
        distanceField: 'proximity',
        maxDistance: map.radius,
        spherical: true,
        limit: 100000,
      },
    });
  }
  if (forSites) {
    pipeline.push({
      $match: {
        author_permlink: { $in: crucialWobjects },
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
  if (tagCategory) {
    const condition = [];
    for (const category of tagCategory) {
      condition.push({
        fields: {
          $elemMatch: {
            name: FIELDS_NAMES.CATEGORY_ITEM,
            body: { $in: category.tags },
            tagCategory: category.categoryName,
          },
        },
      });
    }
    pipeline.push({ $match: { $or: condition } });
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
