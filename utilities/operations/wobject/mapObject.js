const { Wobj } = require('../../../models');
const {
  OBJECT_TYPES,
  FIELDS_NAMES,
  REQUIREDFILDS_WOBJ_LIST,
  MAP_OBJECT_SEARCH_FIELDS,
  REMOVE_OBJ_STATUSES,
  MAP_OBJECT_TYPES,
} = require('../../../constants/wobjectsData');
const { SHOP_SETTINGS_TYPE } = require('../../../constants/sitesConstants');
const { ERROR_OBJ, REDIS_KEYS, TTL_TIME } = require('../../../constants/common');
const _ = require('lodash');
const wObjectHelper = require('../../helpers/wObjectHelper');
const campaignsV2Helper = require('../../helpers/campaignsV2Helper');
const { User } = require('../../../models');
const { SELECT_USER_CAMPAIGN_SHOP } = require('../../../constants/usersData');
const { parseJson } = require('../../helpers/jsonHelper');
const { setFilterByDistance } = require('../../helpers/geoHelper');
const { getAllObjectsInList } = require('./wobjectInfo');
const {
  getCachedData,
  setCachedData,
} = require('../../helpers/cacheHelper');
const jsonHelper = require('../../helpers/jsonHelper');

const adjustRectangles = (rectangles, clientArea) => rectangles.map((rectangle) => {
  const [bottomLeft, topRight] = rectangle;
  const [clientBottomLeft, clientTopRight] = clientArea;

  const x1 = Math.max(bottomLeft[0], clientBottomLeft[0]);
  const y1 = Math.max(bottomLeft[1], clientBottomLeft[1]);
  const x2 = Math.min(topRight[0], clientTopRight[0]);
  const y2 = Math.min(topRight[1], clientTopRight[1]);

  // Check if rectangle is completely outside clientArea
  if (x1 >= x2 || y1 >= y2) {
    return null; // Return null for rectangles completely outside
  }

  return [[x1, y1], [x2, y2]];
}).filter((rectangle) => rectangle !== null); // Filter out null values

const getCachedListsByHost = async ({ authorPermlink, app }) => {
  const key = `${REDIS_KEYS.API_RES_CACHE}:getCachedListsByHost:${app.host}:${authorPermlink}`;
  const cache = await getCachedData(key);
  if (cache) {
    getAllObjectsInList({
      authorPermlink,
      app,
      scanEmbedded: true,
    }).then((data) => setCachedData({
      key, data, ttl: TTL_TIME.THIRTY_DAYS,
    }));

    return jsonHelper.parseJson(cache, []);
  }

  const objectLinks = await getAllObjectsInList({
    authorPermlink,
    app,
    scanEmbedded: true,
  });

  await setCachedData({
    key, data: objectLinks, ttl: TTL_TIME.THIRTY_DAYS,
  });

  return objectLinks;
};

const makeMapCondition = ({ clientBox, boxCoordinates }) => {
  const clientCoordinates = [clientBox.bottomPoint, clientBox.topPoint];

  if (!boxCoordinates?.length) {
    return {
      map: {
        $geoWithin: {
          $box: clientCoordinates,
        },
      },
    };
  }
  const rectangles = boxCoordinates.map((el) => [el.bottomPoint, el.topPoint]);
  const maskPoints = adjustRectangles(rectangles, clientCoordinates);

  return {
    $or: maskPoints.map((el) => ({
      map: {
        $geoWithin: {
          $box: el,
        },
      },
    })),
  };
};

const calculateBoxCenters = (topPoint, bottomPoint) => {
  const topCenter = [(topPoint[0] + bottomPoint[0]) / 2, topPoint[1]];
  const bottomCenter = [(topPoint[0] + bottomPoint[0]) / 2, bottomPoint[1]];
  const rightCenter = [topPoint[0], (topPoint[1] + bottomPoint[1]) / 2];
  const leftCenter = [bottomPoint[0], (topPoint[1] + bottomPoint[1]) / 2];
  const center = [(topPoint[0] + bottomPoint[0]) / 2, (topPoint[1] + bottomPoint[1]) / 2];
  const bottomRight = [topPoint[0], bottomPoint[1]];
  const topLeft = [bottomPoint[0], topPoint[1]];

  return {
    center,
    topCenter,
    bottomCenter,
    leftCenter,
    rightCenter,
    bottomRight,
    topLeft,
  };
};

const objectsRequest = async ({
  box, typesCondition, tagsCondition, objectLinksCondition, boxCoordinates, limit, skip = 0, app,
}) => {
  const andCondition = [];

  const mapCondition = makeMapCondition({ clientBox: box, boxCoordinates });

  andCondition.push(mapCondition);
  if (typesCondition) andCondition.push(typesCondition);
  if (tagsCondition) andCondition.push(tagsCondition);
  if (objectLinksCondition) andCondition.push(objectLinksCondition);

  const { wobjects } = await Wobj.fromAggregation([
    {
      $match: {
        $and: andCondition,
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
        object_type: { $in: MAP_OBJECT_TYPES },
        // ...(authority.length && { 'authority.administrative': { $in: authority } }),
      },
    },
    ...Wobj.getSortingStagesByHost({ host: app?.host }),
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  return wobjects;
};

const getMapObjectCondition = async ({
  app, follower, locale, authorPermlink,
}) => {
  let typesCondition, tagsCondition, objectLinksCondition;

  const { wObject } = await Wobj.getOne(authorPermlink, OBJECT_TYPES.MAP);
  if (!wObject) return { error: ERROR_OBJ.NOT_FOUND };

  const objectWithMap = await wObjectHelper.processWobjects({
    wobjects: [wObject],
    fields: MAP_OBJECT_SEARCH_FIELDS,
    reqUserName: follower,
    app,
    locale,
    returnArray: false,
  });

  const boxCoordinates = parseJson(objectWithMap[FIELDS_NAMES.MAP_RECTANGLES], null);
  const tags = parseJson(objectWithMap[FIELDS_NAMES.MAP_OBJECT_TAGS], null);
  const objectTypes = parseJson(objectWithMap[FIELDS_NAMES.MAP_OBJECT_TYPES], null);

  if (objectTypes?.length) typesCondition = { object_type: { $in: objectTypes } };

  if (tags?.length) {
    tagsCondition = {
      fields: {
        $elemMatch: {
          name: FIELDS_NAMES.CATEGORY_ITEM,
          body: { $in: tags },
        },
      },
    };
  }

  if (objectWithMap[FIELDS_NAMES.MAP_OBJECTS_LIST]) {
    const objectLinks = await getCachedListsByHost({
      authorPermlink: objectWithMap[FIELDS_NAMES.MAP_OBJECTS_LIST],
      app,
    });

    if (objectLinks.length) {
      objectLinksCondition = { author_permlink: { $in: _.uniq(objectLinks) } };
    }
  }

  return {
    objectLinksCondition, tagsCondition, typesCondition, boxCoordinates,
  };
};

const getObjectLinksFromAdvancedMap = async ({
  authorPermlink, app, locale, follower, skip = 0, limit,
}) => {
  const emptyResp = { result: [], hasMore: false };
  const andCondition = [];

  const {
    objectLinksCondition,
    tagsCondition,
    typesCondition,
    boxCoordinates,
  } = await getMapObjectCondition({
    app, follower, locale, authorPermlink,
  });

  if (!boxCoordinates
    && !tagsCondition
    && !typesCondition
    && !objectLinksCondition) return emptyResp;

  const rectangles = _.map(boxCoordinates, (el) => [el.bottomPoint, el.topPoint]);

  const mapCondition = rectangles?.length
    ? {
      $or: rectangles.map((el) => ({
        map: {
          $geoWithin: {
            $box: el,
          },
        },
      })),
    }
    : { map: { $exists: true, $ne: null } };

  andCondition.push(mapCondition);
  if (typesCondition) andCondition.push(typesCondition);
  if (tagsCondition) andCondition.push(tagsCondition);
  if (objectLinksCondition) andCondition.push(objectLinksCondition);

  const { wobjects } = await Wobj.fromAggregation([
    {
      $match: {
        $and: andCondition,
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
        object_type: { $in: MAP_OBJECT_TYPES },
        // ...(authority.length && { 'authority.administrative': { $in: authority } }),
      },
    },
    { $sort: { _id: -1 } },
    {
      $skip: skip,
    },
    {
      $limit: limit + 1,
    },
    {
      $project: {
        author_permlink: 1,
      },
    },
  ]);

  return {
    result: _.take(_.map(wobjects, (el) => el.author_permlink), limit),
    hasMore: wobjects?.length > limit,
  };
};

const getObjectsFromAdvancedMap = async ({
  authorPermlink, app, locale, follower, box, skip = 0, limit,
}) => {
  const emptyResp = { result: [] };

  const {
    objectLinksCondition,
    tagsCondition,
    typesCondition,
    boxCoordinates,
  } = await getMapObjectCondition({
    app, follower, locale, authorPermlink,
  });

  if (!boxCoordinates
    && !tagsCondition
    && !typesCondition
    && !objectLinksCondition) return emptyResp;

  const additionalCoords = calculateBoxCenters(box.topPoint, box.bottomPoint);

  const arrayOfCoordinates = [
    {
      topPoint: additionalCoords.center,
      bottomPoint: box.bottomPoint,
    },
    {
      topPoint: additionalCoords.topCenter,
      bottomPoint: additionalCoords.leftCenter,
    },
    {
      topPoint: additionalCoords.rightCenter,
      bottomPoint: additionalCoords.bottomCenter,
    },
    {
      topPoint: box.topPoint,
      bottomPoint: additionalCoords.center,
    },
  ];

  const { user } = await User.getOne(follower, SELECT_USER_CAMPAIGN_SHOP);

  const responses = await Promise.all(arrayOfCoordinates.map((el) => objectsRequest({
    box: el,
    boxCoordinates,
    typesCondition,
    tagsCondition,
    objectLinksCondition,
    limit: 25,
    app,
  })));

  const wobjects = _.compact(_.flatten(responses));

  await campaignsV2Helper.addNewCampaignsToObjects({
    user,
    wobjects,
  });

  const filtered = setFilterByDistance({
    mapMarkers: true,
    wobjects,
    box,
  });

  const processed = await wObjectHelper.processWobjects({
    wobjects: _.take(filtered, 100),
    fields: REQUIREDFILDS_WOBJ_LIST,
    reqUserName: follower,
    app,
    locale,
  });

  return {
    result: _.orderBy(
      processed,
      ['isPromotedForSite', 'activeCampaignsCount', 'weight', '_id'],
      ['desc', 'desc', 'desc', 'desc'],
    ),
  };
};

const checkMapsForObject = async ({ app, authorPermlink, check }) => {
  const emptyResp = '';

  const {
    objectLinksCondition,
    tagsCondition,
    typesCondition,
    boxCoordinates,
  } = await getMapObjectCondition({
    app, authorPermlink: check,
  });

  if (!boxCoordinates
    && !tagsCondition
    && !typesCondition
    && !objectLinksCondition) return emptyResp;

  const rectangles = _.map(boxCoordinates, (el) => [el.bottomPoint, el.topPoint]);

  const mapCondition = rectangles?.length
    ? {
      $or: rectangles.map((el) => ({
        map: {
          $geoWithin: {
            $box: el,
          },
        },
      })),
    }
    : { map: { $exists: true, $ne: null } };

  const andCondition = [];

  andCondition.push(mapCondition);
  if (typesCondition) andCondition.push(typesCondition);
  if (tagsCondition) andCondition.push(tagsCondition);
  if (objectLinksCondition) andCondition.push(objectLinksCondition);

  const { wobjects } = await Wobj.fromAggregation([
    {
      $match: {
        $and: andCondition,
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
        object_type: { $in: MAP_OBJECT_TYPES },
        author_permlink: authorPermlink,
      },
    },
  ]);

  if (wobjects?.length) return check;
  return emptyResp;
};

const getMapConfigCondition = ({ authorPermlink, app }) => {
  if (!app?.inherited || app?.canBeExtended) return true;
  if (app?.configuration?.shopSettings?.type !== SHOP_SETTINGS_TYPE.OBJECT) return true;
  return !!(app?.configuration?.shopSettings?.type === SHOP_SETTINGS_TYPE.OBJECT
    && app?.configuration?.shopSettings?.value === authorPermlink);
};

const getMapObjectFromObjectLink = async ({ authorPermlink, app }) => {
  const configCondition = getMapConfigCondition({ app, authorPermlink });
  if (configCondition) return '';

  const { wObject } = await Wobj.getOne(app?.configuration?.shopSettings?.value);
  if (!wObject) return '';

  const processed = await wObjectHelper.processWobjects({
    wobjects: [wObject],
    fields: REQUIREDFILDS_WOBJ_LIST,
    app,
    returnArray: false,
  });

  const links = _.reduce(processed[FIELDS_NAMES.MENU_ITEM], (acc, el) => {
    const json = parseJson(el.body, null);
    if (!json) return acc;
    if (json?.objectType !== OBJECT_TYPES.MAP || !json?.linkToObject) return acc;
    acc.push(json.linkToObject);
    return acc;
  }, []);

  const { result } = await Wobj.findObjects({
    filter: {
      object_type: OBJECT_TYPES.MAP,
      author_permlink: { $in: links },
    },
  });
  if (!result?.length) return '';
  if (result.length === 1) return result[0].author_permlink;

  const responses = await Promise.all(
    result.map((el) => checkMapsForObject({ app, authorPermlink, check: el.author_permlink })),
  );

  const existOnObjects = _.compact(responses);
  if (!existOnObjects.length) return '';
  if (existOnObjects.length === 1) return existOnObjects[0];

  if (processed?.sortCustom?.include?.length) {
    for (const item of processed?.sortCustom?.include ?? []) {
      const menuItem = _.find(processed.menuItem, (el) => el.permlink === item);
      if (!menuItem) continue;
      const json = parseJson(menuItem.body, null);
      if (!json) continue;
      if (json?.objectType !== OBJECT_TYPES.MAP || !json?.linkToObject) continue;

      if (_.includes(existOnObjects, json.linkToObject)) return json.linkToObject;
    }
  }

  for (const item of links) {
    if (_.includes(existOnObjects, item)) return item;
  }

  return '';
};

module.exports = {
  getObjectsFromAdvancedMap,
  getObjectLinksFromAdvancedMap,
  getMapObjectFromObjectLink,
};
