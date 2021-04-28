/* eslint-disable camelcase */
const { FIELDS_NAMES, SEARCH_FIELDS, OBJECT_TYPES } = require('constants/wobjectsData');
const { addCampaignsToWobjectsSites } = require('utilities/helpers/campaignsHelper');
const { getSessionApp } = require('utilities/helpers/sitesHelper');
const geoHelper = require('utilities/helpers/geoHelper');
const { Wobj, ObjectType, User } = require('models');
const _ = require('lodash');

exports.searchWobjects = async (data) => {
  const appInfo = await getAppInfo(data);

  if (_.isUndefined(data.string)) data.string = '';
  if (_.isUndefined(data.limit)) data.limit = 10;

  return appInfo.forExtended || appInfo.forSites
    ? sitesWobjectSearch({ ...data, ...appInfo })
    : defaultWobjectSearch({ ...data, ...appInfo });
};

const getAppInfo = async ({ app, addHashtag }) => {
  if (!app) ({ result: app } = await getSessionApp());
  const supportedTypes = _.get(app, 'supported_object_types', []);
  if (addHashtag) supportedTypes.push(OBJECT_TYPES.HASHTAG);

  return {
    crucialWobjects: _.get(app, 'supported_objects', []),
    forExtended: _.get(app, 'canBeExtended'),
    forSites: _.get(app, 'inherited'),
    supportedTypes,
    app,
  };
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
    pipeline: makeSitePipeline(data),
    string: data.string,
    object_type: data.object_type,
  });

  if (data.needCounters && !error) {
    return searchWithCounters({ ...data, wobjects });
  }

  if (data.userName) ({ user } = await User.getOne(data.userName));

  result = await addCampaignsToWobjectsSites({ wobjects: _.cloneDeep(wobjects), user, ...data });
  result = geoHelper.setFilterByDistance({
    mapMarkers: data.mapMarkers, wobjects: result, box: data.box,
  });

  return {
    wobjects: _.take(result, data.limit),
    hasMore: result.length > data.limit,
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
const makeSitePipeline = ({
  crucialWobjects, string, object_type, forParent, box, addHashtag, mapMarkers,
  skip, limit, supportedTypes, forSites, tagCategory, map, sort,
}) => {
  const pipeline = [...matchSitesPipe({
    crucialWobjects,
    supportedTypes,
    object_type,
    tagCategory,
    addHashtag,
    forSites,
    string,
    map,
    box,
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
  crucialWobjects, string, object_type, supportedTypes, forSites, tagCategory, map, box, addHashtag,
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
  const matchCond = {
    $match: {
      object_type: { $in: supportedTypes },
      'status.title': { $nin: ['unavailable', 'nsfw', 'relisted'] },
    },
  };
  if (forSites && !addHashtag) matchCond.$match.author_permlink = { $in: crucialWobjects };
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
