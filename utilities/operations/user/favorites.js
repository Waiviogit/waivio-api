const _ = require('lodash');
const {
  Wobj, User, Post, userShopDeselectModel,
} = require('../../../models');
const { processUserAffiliate } = require('../affiliateProgram/processAffiliate');
const wObjectHelper = require('../../helpers/wObjectHelper');
const {
  REQUIREDFILDS_WOBJ_LIST, FAVORITES_OBJECT_TYPES,
  REMOVE_OBJ_STATUSES,
} = require('../../../constants/wobjectsData');
const campaignsV2Helper = require('../../helpers/campaignsV2Helper');
const { SELECT_USER_CAMPAIGN_SHOP } = require('../../../constants/usersData');
const { isMobileDevice } = require('../../../middlewares/context/contextHelper');

const orderMap = new Map(FAVORITES_OBJECT_TYPES.map((value, index) => [value, index]));

const sortArrayBasedOnOrder = (arrayToSort) => (
  arrayToSort.slice().sort((a, b) => orderMap.get(a) - orderMap.get(b)));

const getConditionObjectsFromPosts = async ({ userName }) => {
  const dbObjects = await Promise.all([
    User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP),
    Post.getFavoritesLinksFromPosts({ userName }),
    userShopDeselectModel.findUsersLinks({ userName }),
  ]);

  const [
    userResp,
    wobjectsFromPosts,
    deselect,
  ] = dbObjects;

  const hideLinkedObjects = _.get(userResp, 'user.user_metadata.settings.hideFavoriteObjects', false);

  return {
    ...(!_.isEmpty(deselect) && { author_permlink: { $nin: deselect } }),
    ...(!_.isEmpty(wobjectsFromPosts)
      && !hideLinkedObjects
      && { $or: [{ author_permlink: { $in: wobjectsFromPosts } }] }),
    'status.title': { $nin: REMOVE_OBJ_STATUSES },
  };
};

const getUserFavoritesList = async ({ userName }) => {
  const specialCondition = await getConditionObjectsFromPosts({ userName });

  const { result, error } = await Wobj.getFavoritesListByUsername({ userName, specialCondition });
  if (error) return { error };

  const sortedArr = _.chain(result)
    .orderBy(['count'], ['desc'])
    .map((el) => el._id)
    .value();

  return { result: sortedArr };
};

const getFavorites = async ({
  userName, skip, limit, objectType, app, locale, countryCode, follower,
}) => {
  const specialCondition = await getConditionObjectsFromPosts({ userName });

  const { result, error } = await Wobj.getFavoritesByUsername({
    userName, skip, limit: limit + 1, objectType, specialCondition,
  });

  if (error || !result.length) {
    return {
      result: [],
      hasMore: false,
    };
  }

  const affiliateCodes = await processUserAffiliate({
    app,
    locale,
    creator: userName,
  });

  const processed = await wObjectHelper.processWobjects({
    wobjects: _.take(result, limit),
    fields: REQUIREDFILDS_WOBJ_LIST,
    reqUserName: follower,
    app,
    locale,
    countryCode,
    affiliateCodes,
    mobile: isMobileDevice(),
  });
  const { user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP);

  await campaignsV2Helper.addNewCampaignsToObjects({ user, wobjects: processed });

  return {
    result: processed,
    hasMore: result.length > limit,
  };
};

const getFavoritesMap = async ({
  userName, skip, limit, objectTypes, app, locale, follower, box,
}) => {
  const specialCondition = await getConditionObjectsFromPosts({ userName });

  const defaultFilter = {
    'authority.administrative': userName,
  };
  const filter = specialCondition?.$or?.length
    ? {
      $or: [...specialCondition.$or, defaultFilter],
      object_type: { $in: objectTypes },
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
      ...(specialCondition.author_permlink
        && { author_permlink: specialCondition.author_permlink }),
    }
    : {
      ...defaultFilter,
      ...specialCondition,
      object_type: { $in: objectTypes },
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
    };

  const pipe = [
    {
      $match: {
        map: {
          $geoWithin: {
            $box: [box.bottomPoint, box.topPoint],
          },
        },
      },
    },
    {
      $match: filter,
    },
    ...Wobj.getSortingStagesByHost({ host: app?.host }),
    {
      $skip: skip,
    },
    {
      $limit: limit + 1,
    },
  ];

  const { wobjects, error } = await Wobj.fromAggregation(pipe);
  if (error) return { result: [], hasMore: false };

  const processed = await wObjectHelper.processWobjects({
    wobjects: _.take(wobjects, limit),
    fields: REQUIREDFILDS_WOBJ_LIST,
    reqUserName: follower,
    app,
    locale,
    mobile: isMobileDevice(),
  });
  const { user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP);

  await campaignsV2Helper.addNewCampaignsToObjects({ user, wobjects: processed });

  return {
    result: processed,
    hasMore: wobjects.length > limit,
  };
};

module.exports = {
  getUserFavoritesList,
  getFavorites,
  getFavoritesMap,
};
