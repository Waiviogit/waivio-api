const { Wobj } = require('models');
const {
  OBJECT_TYPES,
  FIELDS_NAMES,
  REQUIREDFILDS_WOBJ_LIST,
  MAP_OBJECT_SEARCH_FIELDS,
  REMOVE_OBJ_STATUSES,
} = require('constants/wobjectsData');
const { ERROR_OBJ, REDIS_KEYS, TTL_TIME } = require('constants/common');
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
  box, typesCondition, tagsCondition, objectLinksCondition, boxCoordinates,
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
        // ...(authority.length && { 'authority.administrative': { $in: authority } }),
      },
    },
    { $sort: { activeCampaignsCount: -1, weight: -1 } },
    {
      $limit: 100,
    },
  ]);

  return wobjects;
};

const getObjectsFromAdvancedMap = async ({
  authorPermlink, app, locale, follower, box, skip = 0, limit,
}) => {
  let typesCondition, tagsCondition, objectLinksCondition;

  const emptyResp = { result: [] };
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

  if (!objectWithMap[FIELDS_NAMES.MAP_RECTANGLES]
    && !objectWithMap[FIELDS_NAMES.MAP_OBJECT_TAGS]
    && !objectWithMap[FIELDS_NAMES.MAP_OBJECT_TYPES]
    && !objectWithMap[FIELDS_NAMES.MAP_OBJECTS_LIST]
  ) return emptyResp;

  const boxCoordinates = parseJson(objectWithMap[FIELDS_NAMES.MAP_RECTANGLES], null);
  const tags = parseJson(objectWithMap[FIELDS_NAMES.MAP_OBJECT_TAGS], null);
  const objectTypes = parseJson(objectWithMap[FIELDS_NAMES.MAP_OBJECT_TYPES], null);

  if (!boxCoordinates
    && !tags
    && !objectTypes
    && !objectWithMap[FIELDS_NAMES.MAP_OBJECTS_LIST]) return emptyResp;

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

  // const authority = [];
  // const social = checkForSocialSite(app?.parentHost ?? '');
  // if (social) authority.push(...[app.owner, ...app.authority]);

  if (objectWithMap[FIELDS_NAMES.MAP_OBJECTS_LIST]) {
    const objectLinks = await getCachedListsByHost({
      authorPermlink: objectWithMap[FIELDS_NAMES.MAP_OBJECTS_LIST],
      app,
    });

    if (objectLinks.length) {
      objectLinksCondition = { author_permlink: { $in: _.uniq(objectLinks) } };
    }
  }

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
    wobjects: _.take(filtered, 400),
    fields: REQUIREDFILDS_WOBJ_LIST,
    reqUserName: follower,
    app,
    locale,
  });

  return {
    result: processed,
  };
};

module.exports = {
  getObjectsFromAdvancedMap,
};
