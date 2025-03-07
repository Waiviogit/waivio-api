/* eslint-disable camelcase */
const _ = require('lodash');
const { addCampaignsToWobjectsSites } = require('../../helpers/campaignsHelper');
const { FIELDS_NAMES, REMOVE_OBJ_STATUSES } = require('../../../constants/wobjectsData');
const searchHelper = require('../../helpers/searchHelper');
const geoHelper = require('../../helpers/geoHelper');
const {
  Wobj, ObjectType, User, Post, userShopDeselectModel,
} = require('../../../models');
const { checkForSocialSite } = require('../../helpers/sitesHelper');
const { SHOP_SETTINGS_TYPE } = require('../../../constants/sitesConstants');
const { getAppAuthorities } = require('../../helpers/appHelper');

const getObjectPermlinksFromUrl = (link) => {
  try {
    const url = new URL(link);

    const objectPath = /^\/object|^\/checklist/.test(url.pathname);
    const searchParams = /\?breadcrumbs=/.test(url.search);
    if (!objectPath) return;

    const links = [];

    const parts = url.pathname.split('/');
    const mainPermlink = parts.length > 3 ? parts[2] : (parts[2] || '');
    if (mainPermlink) links.push(mainPermlink);
    if (url?.hash) {
      const hashObjects = url.hash
        .replace('#', '')
        .split('/');
      if (hashObjects?.length)links.push(...hashObjects);
    }
    if (searchParams) {
      const searchObjects = url.search
        .replace(/\?breadcrumbs=/, '')
        .split('/');
      if (searchObjects?.length)links.push(...searchObjects);
    }

    return _.compact(_.uniq(links));
  } catch (error) {
    return [];
  }
};

const checkUserShop = (app) => app?.configuration?.shopSettings?.type === SHOP_SETTINGS_TYPE.USER;

const addRequestDetails = (data) => {
  if (_.isUndefined(data.string)) data.string = '';
  const linksFromUrl = getObjectPermlinksFromUrl(data.string);
  if (linksFromUrl?.length) {
    data.linksFromUrl = linksFromUrl;
    data.string = '';
  }
  if (!_.includes(data.string, '@') || !_.includes(data.string, '.')) {
    data.string = data.string.replace(/[.,%?+*|{}[\]()<>“”^'"\\\-_=!&$:]/g, '').trim();
  }
  data.string = data.string.replace(/  +/g, ' ');
  if (_.isUndefined(data.limit)) data.limit = 10;
};

const searchWobjects = async (data) => {
  const appInfo = await searchHelper.getAppInfo(data);
  addRequestDetails(data);

  if (appInfo.forExtended || appInfo.forSites) {
    const social = checkForSocialSite(appInfo?.app?.parentHost ?? '');

    if (social) return socialSearch({ ...data, ...appInfo });
    return sitesWobjectSearch({ ...data, ...appInfo });
  }

  return defaultWobjectSearch({ ...data, ...appInfo });
};

const socialSearch = async (data) => {
  const userShop = checkUserShop(data?.app);

  if (userShop) {
    const names = [data?.app?.configuration?.shopSettings?.value, ...data?.app?.authority ?? []];
    data.userShop = userShop;
    data.userLinks = await Post.getProductLinksFromPosts({ names });
    data.deselect = await userShopDeselectModel.findUsersLinks({ names });
  }

  const { wobjects, error } = await getWobjectsFromAggregation({
    pipeline: matchSocialPipe(data),
    string: data.string,
    object_type: data.object_type,
  });

  if (data.needCounters && !error) {
    return searchWithCounters({
      wobjects,
      socialSites: true,
      ...data,
    });
  }

  const user = data.userName ? (await User.getOne(data.userName))?.user : {};
  const result = await addCampaignsToWobjectsSites({ wobjects, user, ...data });

  return {
    wobjects: _.take(result, data.limit),
    hasMore: wobjects.length > data.limit,
    error,
  };
};

const defaultWobjectSearch = async (data) => {
  const { wobjects, error } = await getWobjectsFromAggregation({
    pipeline: makePipeline(data),
    string: data.string,
    object_type: data.object_type,
    onlyObjectTypes: data.onlyObjectTypes,
  });

  if (data.needCounters && !error) {
    return searchWithCounters({ ...data, wobjects });
  }

  return {
    wobjects: _.take(wobjects, data.limit),
    hasMore: wobjects?.length > data.limit,
    error,
  };
};

const sitesWobjectSearch = async (data) => {
  let user, result;
  const { wobjects, error } = await getSiteWobjects(data);

  if (data.needCounters && !error) {
    return searchWithCounters({ ...data, wobjects });
  }

  if (data.userName) ({ user } = await User.getOne(data.userName));

  result = await addCampaignsToWobjectsSites({ wobjects, user, ...data });
  result = geoHelper.setFilterByDistance({
    mapMarkers: data.mapMarkers, wobjects: result, box: data.box,
  });

  return {
    wobjects: _.take(result, data.limit),
    hasMore: result.length > data.limit,
    error,
  };
};

const getSiteWobjects = async (data) => {
  if (data.object_type && data.object_type !== 'restaurant') {
    const { wobjects, error: aggregateError } = await getWobjectsFromAggregation({
      pipeline: makePipelineForDrinksAndDishes(data),
      string: data.string,
      object_type: data.object_type,
    });
    const authorPermlinks = wobjects.map((obj) => obj.author_permlink);
    const { wobjects: result = [], error: findError } = await Wobj.fromAggregation([
      { $match: { author_permlink: { $in: authorPermlinks } } },
      { $addFields: { __order: { $indexOfArray: [authorPermlinks, '$author_permlink'] } } },
      { $sort: { __order: 1 } },
    ]);

    return { wobjects: result, error: aggregateError || findError };
  }

  return getWobjectsFromAggregation({
    pipeline: makeSitePipelineForRestaurants(data),
    string: data.string,
    object_type: data.object_type,
  });
};

const getWobjectsFromAggregation = async ({
  pipeline, string, object_type, onlyObjectTypes,
}) => {
  const { wobjects = [], error } = await Wobj.fromAggregation(pipeline);
  const { wObject } = await Wobj.getOne(string, object_type, true, onlyObjectTypes);

  if (wObject) {
    _.remove(wobjects, (wobj) => wObject.author_permlink === wobj.author_permlink);
    wobjects.splice(0, 0, wObject);
  }
  if (!wobjects?.length && error) return { wobjects, error };

  return { wobjects };
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
    const tagCategory = _.find(
      objectType.supposed_updates,
      { name: FIELDS_NAMES.TAG_CATEGORY },
    );
    if (tagCategory) wobj.tagCategories = tagCategory.values;
    return wobj;
  });
  return wobjectsCounts;
};

/** If forParent object exist - add checkField for primary sorting, else sort by weight */
const makeSitePipelineForRestaurants = ({
  crucialWobjects, string, object_type, forParent, box, addHashtag, mapMarkers,
  skip, limit, supportedTypes, forSites, tagCategory, map, sort, linksFromUrl,
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
    linksFromUrl,
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
  string, limit, skip, crucialWobjects, forParent, object_type, onlyObjectTypes, linksFromUrl, app,
}) => {
  const pipeline = [matchSimplePipe({
    string, object_type, onlyObjectTypes, linksFromUrl,
  })];
  if (_.get(crucialWobjects, 'length') || forParent) {
    pipeline.push(
      {
        $addFields: {
          crucial_wobject: { $cond: { if: { $in: ['$author_permlink', crucialWobjects] }, then: 1, else: 0 } },
          priority: { $cond: { if: { $eq: ['$parent', forParent] }, then: 1, else: 0 } },
        },
      },
      { $sort: { crucial_wobject: -1, priority: -1, weight: -1 } },
    );
  } else {
    pipeline.push(...Wobj.getSortingStagesByHostSearch({ host: app?.host }));
  }
  if (onlyObjectTypes?.length) {
    pipeline.push({ $match: { object_type: { $in: onlyObjectTypes } } });
  }
  pipeline.push({ $skip: skip || 0 }, { $limit: limit + 1 });

  return pipeline;
};

const makeCountPipeline = (data = {}) => {
  const {
    string, forSites, crucialWobjects, object_type,
    supportedTypes, forExtended, socialSites = false,
  } = data;
  const pipeline = [
    { $group: { _id: '$object_type', count: { $sum: 1 } } },
    { $project: { _id: 0, object_type: '$_id', count: 1 } },
  ];
  if (forSites || forExtended) {
    socialSites
      ? pipeline.unshift(...matchSocialPipe({
        ...data,
        counters: true,
      }))
      : pipeline.unshift(...matchSitesPipe({
        string, crucialWobjects, object_type, supportedTypes, forSites, linksFromUrl: data.linksFromUrl,
      }));
  } else {
    pipeline.unshift(matchSimplePipe({ string, object_type, linksFromUrl: data.linksFromUrl }));
  }
  return pipeline;
};

/** If search request for custom sites - find objects only by authorities and supported objects,
 * if app can be extended - search objects by supported object types */
const matchSitesPipe = ({
  crucialWobjects, string, supportedTypes, forSites, tagCategory, map, box, addHashtag, object_type, linksFromUrl,
}) => {
  const pipeline = [];
  if (string) {
    pipeline.push({ $match: { $text: { $search: `\"${string}\"` } } });
  }
  if (map) {
    pipeline.push({
      $geoNear: {
        near: { type: 'Point', coordinates: map.coordinates },
        distanceField: 'proximity',
        maxDistance: map.radius,
        spherical: true,
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
      ...supportedTypes?.length && { object_type: { $in: supportedTypes } },
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
      ...(linksFromUrl && { author_permlink: { $in: linksFromUrl } }),
    },
  };
  if (forSites && !addHashtag) {
    const permlinks = linksFromUrl?.length
      ? linksFromUrl.filter((link) => crucialWobjects.includes(link))
      : crucialWobjects;
    matchCond.$match.author_permlink = { $in: permlinks };
  }
  pipeline.push(matchCond);
  if (tagCategory) {
    const condition = _.reduce(tagCategory, (acc, category) => {
      _.map(category.tags, (tag) => acc.push({ search: { $regex: tag, $options: 'i' } }));
      return acc;
    }, []);
    pipeline.push({ $match: { $and: condition } });
  }

  if (object_type) pipeline.push({ $match: { object_type } });

  return pipeline;
};

const matchSocialPipe = ({
  string, addHashtag, object_type, app, skip, limit, userLinks = [], deselect = [], counters, onlyObjectTypes, linksFromUrl,
}) => {
  const pipeline = [
    {
      $match: {
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
        ...(!addHashtag && {
          $or: [
            {
              'authority.administrative': { $in: getAppAuthorities(app) },
            },
          ],
        }),
        ...(object_type && { object_type }),
        ...(onlyObjectTypes && { object_type: { $in: onlyObjectTypes } }),
        ...(linksFromUrl && { author_permlink: { $in: linksFromUrl } }),
      },
    },
    ...Wobj.getSortingStagesByHostSearch({ host: app?.host }),
  ];
  if (!counters) {
    pipeline.push(...[{ $skip: skip || 0 }, { $limit: limit + 1 }]);
  }
  if (userLinks.length && !addHashtag) {
    const and = deselect.length
      ? [{ author_permlink: { $in: userLinks } }, { author_permlink: { $nin: deselect } }]
      : [{ author_permlink: { $in: userLinks } }];
    pipeline[0].$match.$or.push({
      $and: and,
    });
  }
  if (string) {
    pipeline.unshift({ $match: { $text: { $search: `\"${string}\"` } } });
  }
  return pipeline;
};

const matchSimplePipe = ({
  string, object_type, onlyObjectTypes, linksFromUrl,
}) => ({
  $match: {
    'status.title': { $nin: REMOVE_OBJ_STATUSES },
    ...(object_type && { object_type }),
    ...(onlyObjectTypes && { object_type: { $in: onlyObjectTypes } }),
    ...(linksFromUrl && { author_permlink: { $in: linksFromUrl } }),
    ...(string && { $text: { $search: `\"${string}\"` } }),
  },
});

const makePipelineForDrinksAndDishes = ({
  crucialWobjects, string, object_type, forParent, box, addHashtag, mapMarkers, supportedTypes, forSites, tagCategory,
  map, sort, skip, limit, linksFromUrl,
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
    linksFromUrl,
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

const searchByArea = async ({
  object_type, app, sample, string, box,
}) => {
  const mainPipe = matchSitesPipe({
    object_type, string, box,
  });
  const social = checkForSocialSite(app?.parentHost ?? '');

  /** ------if social site search in authority objects
   * also check if site based on user and add conditions
   */
  if (social) {
    const appAuthorities = getAppAuthorities(app);
    const sitesCondition = [
      {
        'authority.ownership': { $in: appAuthorities },
      },
      {
        'authority.administrative': { $in: appAuthorities },
      },
    ];

    const userShop = checkUserShop(app);
    if (userShop) {
      const userLinks = await Post.getProductLinksFromPosts({ names: appAuthorities });
      if (userLinks.length) {
        const deselect = await userShopDeselectModel.findUsersLinks({ names: appAuthorities });
        const and = deselect.length
          ? [{ author_permlink: { $in: userLinks } }, { author_permlink: { $nin: deselect } }]
          : [{ author_permlink: { $in: userLinks } }];

        sitesCondition.push({ $and: and });
      }
    }
    mainPipe.push({ $match: { $or: sitesCondition } });
  }

  mainPipe.push(
    { $sample: { size: sample } },
  );

  const { wobjects, error } = await Wobj.fromAggregation(mainPipe);
  if (error) return { error };

  return { wobjects };
};

module.exports = {
  searchWobjects,
  defaultWobjectSearch,
  addRequestDetails,
  searchByArea,
};
