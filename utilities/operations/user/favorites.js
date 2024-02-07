const { Wobj, User, Post } = require('models');
const _ = require('lodash');
const { processUserAffiliate } = require('../affiliateProgram/processAffiliate');
const wObjectHelper = require('../../helpers/wObjectHelper');
const {
  REQUIREDFILDS_WOBJ_LIST, FAVORITES_OBJECT_TYPES,
  REMOVE_OBJ_STATUSES,
} = require('../../../constants/wobjectsData');
const campaignsV2Helper = require('../../helpers/campaignsV2Helper');
const { SELECT_USER_CAMPAIGN_SHOP } = require('../../../constants/usersData');
const { userShopDeselectModel } = require('../../../models');

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

  const sortedArr = sortArrayBasedOnOrder(result);

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
  });
  const { user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP);

  await campaignsV2Helper.addNewCampaignsToObjects({ user, wobjects: processed });

  return {
    result: processed,
    hasMore: result.length > limit,
  };
};

module.exports = {
  getUserFavoritesList,
  getFavorites,
};
