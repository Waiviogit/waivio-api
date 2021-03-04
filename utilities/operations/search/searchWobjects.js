/* eslint-disable camelcase */
const { addCampaignsToWobjects } = require('utilities/helpers/campaignsHelper');
const { FIELDS_NAMES, SEARCH_FIELDS } = require('constants/wobjectsData');
const { getSessionApp } = require('utilities/helpers/sitesHelper');
const geoHelper = require('utilities/helpers/geoHelper');
const { Wobj, ObjectType, User } = require('models');
const _ = require('lodash');

exports.searchWobjects = async (data) => {
  const {
    supportedTypes, crucialWobjects, forExtended, forSites, sessionApp,
  } = await getAppInfo(data);

  return forExtended || forSites
    ? sitesWobjectSearch({
      ...data, supportedTypes, crucialWobjects, forExtended, forSites, sessionApp,
    })
    : defaultWobjectSearch(data);
};

const getAppInfo = async ({ app }) => {
  if (!app) ({ result: app } = await getSessionApp());
  return {
    supportedTypes: _.get(app, 'supported_object_types', []),
    crucialWobjects: _.get(app, 'supported_objects', []),
    forExtended: _.get(app, 'canBeExtended'),
    forSites: _.get(app, 'inherited'),
    sessionApp: app,
  };
};

const defaultWobjectSearch = async ({
  string = '', object_type, limit = 10, skip, forParent, required_fields,
  needCounters = false, supportedTypes, crucialWobjects, forExtended, forSites,
}) => {
  const pipeline = makePipeline({
    string, object_type, limit, skip, crucialWobjects, forParent, required_fields,
  });

  const { wobjects, error } = await getWobjectsFromAggregation({ pipeline, string, object_type });

  if (needCounters && !error) {
    return searchWithCounters({
      crucialWobjects, supportedTypes, object_type, forExtended, wobjects, forSites, string, limit,
    });
  }

  return {
    wobjects: _.take(wobjects, limit),
    hasMore: wobjects.length > limit,
    error,
  };
};

const sitesWobjectSearch = async ({
  string = '', object_type, limit = 10, skip, forParent, box, forSites,
  tagCategory, userName, simplified, map, sort, supportedTypes, crucialWobjects, sessionApp,
}) => {
  const pipeline = makeSitePipeline({
    crucialWobjects,
    supportedTypes,
    tagCategory,
    object_type,
    forSites,
    forParent,
    string,
    limit,
    sort,
    skip,
    map,
    box,
  });
  const { wobjects, error } = await getWobjectsFromAggregation({ pipeline, string, object_type });
  /** Fill campaigns for some objects,
   * be careful, we pass objects by reference and in this method we will directly modify them */
  let user;
  if (userName) ({ user } = await User.getOne(userName));
  await addCampaignsToWobjects({
    wobjects, app: sessionApp, simplified, user,
  });

  geoHelper.setFilterByDistance({ wobjects, box });
  if (map) wobjects.sort((a, b) => _.get(a, 'proximity') - _.get(b, 'proximity'));
  wobjects.sort((a, b) => {
    if (_.has(b, 'campaigns') && _.has(a, 'campaigns')) {
      return b.campaigns.max_reward - a.campaigns.max_reward;
    }
    return _.has(b, 'campaigns') - _.has(a, 'campaigns');
  });

  return {
    wobjects: _.take(wobjects, limit),
    hasMore: wobjects.length > limit,
    error,
  };
};

const getWobjectsFromAggregation = async ({ pipeline, string, object_type }) => {
  const { wobjects = [], error } = await Wobj.fromAggregation(pipeline);

  const { wObject } = await Wobj.getOne(string, object_type, true);

  if (wObject && wobjects.length) {
    _.remove(wobjects, (wobj) => wObject.author_permlink === wobj.author_permlink);
    wobjects.splice(0, 0, wObject);
  }

  return { wobjects, error };
};

const searchWithCounters = async ({
  crucialWobjects, supportedTypes, object_type, forExtended, wobjects, forSites, string, limit,
}) => {
  // eslint-disable-next-line prefer-const
  let { wobjects: wobjectsCounts, error } = await Wobj.fromAggregation(makeCountPipeline({
    string, crucialWobjects, object_type, forSites, supportedTypes, forExtended,
  }));
  if (_.get(wobjectsCounts, 'length')) {
    wobjectsCounts = await fillTagCategories(wobjectsCounts);
  }

  return {
    wobjects: _.take(wobjects, limit),
    wobjectsCounts,
    error,
  };
};

const fillTagCategories = async (wobjectsCounts) => {
  const { result: types } = await ObjectType.aggregate(
    [{ $match: { name: { $in: _.map(wobjectsCounts, 'object_type') } } }],
  );
  wobjectsCounts = wobjectsCounts.map((wobj) => {
    const objectType = _.find(types, { name: wobj.object_type });
    if (!_.get(objectType, 'supposed_updates')) {
      wobj.tagCategories = [];
      return wobj;
    }
    const tagCategory = _.find(objectType.supposed_updates,
      { name: FIELDS_NAMES.TAG_CATEGORY });
    if (tagCategory) wobj.tagCategories = tagCategory.values;
    return wobj;
  });
  return wobjectsCounts;
};

/** If forParent object exist - add checkField for primary sorting, else sort by weight */
const makeSitePipeline = ({
  crucialWobjects, string, object_type, forParent, box,
  skip, limit, supportedTypes, forSites, tagCategory, map, sort,
}) => {
  const pipeline = [...matchSitesPipe({
    string, crucialWobjects, object_type, supportedTypes, forSites, tagCategory, map,
  })];
  if (box) {
    pipeline.push({
      $match: {
        map: {
          $geoWithin: {
            $box: [box.bottomPoint, box.topPoint],
          },
        },
      },
    });
  }
  if (forParent) {
    pipeline.push({
      $addFields: {
        priority: { $cond: { if: { $eq: ['$parent', forParent] }, then: 1, else: 0 } },
      },
    }, { $sort: { priority: -1, [sort]: -1 } });
  } else pipeline.push({ $sort: { [sort]: -1 } });

  pipeline.push({ $skip: skip || 0 }, { $limit: limit || 10 });
  return pipeline;
};

/** Search pipe for basic websites, which cannot be extended and not inherited */
const makePipeline = ({
  string, object_type, limit, skip, crucialWobjects, forParent,
}) => {
  const pipeline = [matchSimplePipe({ string, object_type })];
  if (_.get(crucialWobjects, 'length') || forParent) {
    pipeline.push({
      $addFields: {
        crucial_wobject: { $cond: { if: { $in: ['$author_permlink', crucialWobjects] }, then: 1, else: 0 } },
        priority: { $cond: { if: { $eq: ['$parent', forParent] }, then: 1, else: 0 } },
      },
    },
    { $sort: { crucial_wobject: -1, priority: -1, weight: -1 } });
  } else pipeline.push({ $sort: { weight: -1 } });
  pipeline.push({ $skip: skip || 0 }, { $limit: limit || 10 });

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
  const matchCond = {
    $match: {
      object_type: { $in: supportedTypes },
      'status.title': { $nin: ['unavailable', 'nsfw', 'relisted'] },
    },
  };
  if (forSites)matchCond.$match.author_permlink = { $in: crucialWobjects };
  pipeline.push(matchCond);
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
