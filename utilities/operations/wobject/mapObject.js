const { Wobj } = require('models');
const {
  OBJECT_TYPES, FIELDS_NAMES, REQUIREDFILDS_WOBJ_LIST, MAP_OBJECT_SEARCH_FIELDS,
} = require('constants/wobjectsData');
const { ERROR_OBJ } = require('constants/common');
const _ = require('lodash');
const wObjectHelper = require('../../helpers/wObjectHelper');
const campaignsV2Helper = require('../../helpers/campaignsV2Helper');
const { User } = require('../../../models');
const { SELECT_USER_CAMPAIGN_SHOP } = require('../../../constants/usersData');
const { parseJson } = require('../../helpers/jsonHelper');
const { REMOVE_OBJ_STATUSES } = require('../../../constants/wobjectsData');
const { setFilterByDistance } = require('../../helpers/geoHelper');
const { checkForSocialSite } = require('../../helpers/sitesHelper');
const { getAllObjectsInList } = require('./wobjectInfo');

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

const getObjectsFromAdvancedMap = async ({
  authorPermlink, app, locale, follower, box, skip = 0, limit,
}) => {
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

  if (!boxCoordinates && !tags && !objectTypes) return emptyResp;

  const mapCondition = makeMapCondition({ clientBox: box, boxCoordinates });

  const andCondition = [mapCondition];

  if (objectTypes?.length) andCondition.push({ object_type: { $in: objectTypes } });

  if (tags?.length) {
    andCondition.push({
      fields: {
        $elemMatch: {
          name: FIELDS_NAMES.CATEGORY_ITEM,
          body: { $in: tags },
        },
      },
    });
  }

  // const authority = [];
  // const social = checkForSocialSite(app?.parentHost ?? '');
  // if (social) authority.push(...[app.owner, ...app.authority]);

  if (objectWithMap[FIELDS_NAMES.MAP_OBJECTS_LIST]) {
    const objectLinks = await getAllObjectsInList({
      authorPermlink: objectWithMap[FIELDS_NAMES.MAP_OBJECTS_LIST],
      app,
      scanEmbedded: true,
    });

    if (objectLinks.length) {
      andCondition.push({ author_permlink: { $in: _.uniq(objectLinks) } });
    }
  }

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
      $skip: skip,
    },
    {
      $limit: 250,
    },
  ]);

  if (!wobjects) return emptyResp;

  const { user } = await User.getOne(follower, SELECT_USER_CAMPAIGN_SHOP);
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
    wobjects: _.take(filtered, limit),
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
