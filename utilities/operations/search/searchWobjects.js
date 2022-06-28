/* eslint-disable camelcase */
const { addCampaignsToWobjectsSites } = require('utilities/helpers/campaignsHelper');
const { FIELDS_NAMES, REMOVE_OBJ_STATUSES } = require('constants/wobjectsData');
const searchHelper = require('utilities/helpers/searchHelper');
const geoHelper = require('utilities/helpers/geoHelper');
const { Wobj, ObjectType, User } = require('models');
const _ = require('lodash');

exports.searchWobjects = async (data) => {
  const appInfo = await searchHelper.getAppInfo(data);

  if (_.isUndefined(data.string)) data.string = '';
  data.string = data.string.trim().replace(/[.?+*|{}[\]()"\\@]/g, '\\$&');
  if (_.isUndefined(data.limit)) data.limit = 10;

  return appInfo.forExtended || appInfo.forSites
    ? sitesWobjectSearch({ ...data, ...appInfo })
    : defaultWobjectSearch({ ...data, ...appInfo });
};

const defaultWobjectSearch = async (data) => {
  const { wobjects, error } = await getWobjectsFromAggregation({
    pipeline: makePipeline(data),
    string: data.string,
    object_type: data.object_type,
  });

  if (data.needCounters && !error) {
    return searchWithCounters({ ...data, wobjects });
  }

  return {
    wobjects: _.take(wobjects, data.limit),
    hasMore: wobjects.length > data.limit,
    error,
  };
};

const sitesWobjectSearch = async (data) => {
  let user, result;
  const { wobjects, error } = await getWobjectsFromAggregation({
    pipeline: (data.object_type && data.object_type === 'restaurant') ? makeSitePipelineForRestaurants(data)
      : makePipelineForDrinksAndDishes(data),
    string: data.string,
    object_type: data.object_type,
  });

  let wobjectsToPass = wobjects;
  let errorToPass = error;
  if (data.object_type !== 'restaurant') {
    const { result: dbResult, error: dbError } = await Wobj.find({
      object_type: data.object_type,
      author_permlink: {
        $in:
            wobjects.map((obj) => obj.author_permlink),
      },
    }, {}, { weight: -1 }, data.skip || 0, data.mapMarkers ? 250 : data.limit + 1);
    wobjectsToPass = dbResult;
    errorToPass = dbError;
  }

  if (data.needCounters && !error) {
    return searchWithCounters({ ...data, wobjects: wobjectsToPass });
  }

  if (data.userName) ({ user } = await User.getOne(data.userName));

  result = await addCampaignsToWobjectsSites({ wobjects: _.cloneDeep(wobjectsToPass), user, ...data });
  result = geoHelper.setFilterByDistance({
    mapMarkers: data.mapMarkers, wobjects: result, box: data.box,
  });

  return {
    wobjects: _.take(result, data.limit),
    hasMore: result.length > data.limit,
    error: errorToPass,
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

const searchWithCounters = async (data) => {
  const { wobjects: wobjectsCounts, error } = await Wobj.fromAggregation(makeCountPipeline(data));

  return {
    error,
    wobjects: _.take(data.wobjects, data.limit),
    wobjectsCounts: _.get(wobjectsCounts, 'length')
      ? await fillTagCategories(wobjectsCounts)
      : wobjectsCounts,
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
const makeSitePipelineForRestaurants = ({
  crucialWobjects, string, object_type, forParent, box, addHashtag, mapMarkers,
  skip, limit, supportedTypes, forSites, tagCategory, map, sort,
}) => {
  const pipeline = [...matchSitesPipe({
    crucialWobjects,
    supportedTypes,
    tagCategory,
    addHashtag,
    forSites,
    string,
    map,
    box,
    object_type,
  })];
  if (forParent) {
    pipeline.push({
      $addFields: {
        priority: { $cond: { if: { $eq: ['$parent', forParent] }, then: 1, else: 0 } },
      },
    }, { $sort: { priority: -1, [sort]: -1 } });
  } else pipeline.push({ $sort: { activeCampaignsCount: -1, weight: -1 } });

  pipeline.push({ $skip: skip || 0 }, { $limit: mapMarkers ? 250 : limit + 1 });
  return pipeline;
};

/** Search pipe for basic websites, which cannot be extended and not inherited */
const makePipeline = ({
  string, limit, skip, crucialWobjects, forParent, object_type,
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
  pipeline.push({ $skip: skip || 0 }, { $limit: limit + 1 });

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

/** If search request for custom sites - find objects only by authorities and supported objects,
 * if app can be extended - search objects by supported object types */
const matchSitesPipe = ({
  crucialWobjects, string, supportedTypes, forSites, tagCategory, map, box, addHashtag, object_type,
}) => {
  const pipeline = [];
  pipeline.push({
    $match: {
      ...map && {
        $geoNear: {
          near: { type: 'Point', coordinates: map.coordinates },
          distanceField: 'proximity',
          maxDistance: map.radius,
          spherical: true,
        },
      },
      ...string && {
        $and: [
          { object_type },
          { $text: { $search: `\"${string}\"` } },
        ],
      },
      ...box && {
        map: {
          $geoWithin: {
            $box: [box.bottomPoint, box.topPoint],
          },
        },
      },
      object_type: { $in: supportedTypes },
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
      ...(forSites && !addHashtag) && { author_permlink: { $in: crucialWobjects } },
    },
  });

  if (tagCategory) {
    const condition = _.reduce(tagCategory, (acc, category) => {
      _.map(category.tags, (tag) => acc.push({ search: { $regex: tag, $options: 'i' } }));
      return acc;
    }, []);
    pipeline.push({ $match: { $and: condition } });
  }

  return pipeline;
};

const matchSimplePipe = ({ string, object_type }) => ({
  $match: {
    ...object_type && { object_type },
    'status.title': { $nin: REMOVE_OBJ_STATUSES },
    $text: { $search: `\"${string}\"` },
  },
});

const makePipelineForDrinksAndDishes = ({
  crucialWobjects, string, object_type, forParent, box, addHashtag, mapMarkers, supportedTypes, forSites, tagCategory,
  map, sort, skip, limit,
}) => {
  const pipeline = [...matchSitesPipe({
    crucialWobjects,
    supportedTypes,
    tagCategory,
    addHashtag,
    forSites,
    string,
    map,
    box,
    object_type,
  })];
  if (forParent) {
    pipeline.push({
      $addFields: {
        priority: { $cond: { if: { $eq: ['$parent', forParent] }, then: 1, else: 0 } },
      },
    }, { $sort: { priority: -1, [sort]: -1 } });
  } else pipeline.push({ $sort: { activeCampaignsCount: -1, weight: -1 } });
  pipeline.push({
    $group: {
      _id: '$parent',
      children: {
        $push: {
          weight: '$weight',
          author_permlink: '$author_permlink',
        },
      },
    },
  });
  mapMarkers || (!string && !tagCategory)
    ? pipeline.push(
      { $project: { biggestWeight: { $arrayElemAt: ['$children', 0] } } },
      { $replaceRoot: { newRoot: '$biggestWeight' } },
    )
    : pipeline.push(
      { $project: { firstThree: { $slice: ['$children', 3] } } },
      { $unwind: { path: '$firstThree' } },
      { $replaceRoot: { newRoot: '$firstThree' } },
    );

  pipeline.push({ $skip: skip || 0 }, { $limit: mapMarkers ? 250 : limit + 1 });
  return pipeline;
};
