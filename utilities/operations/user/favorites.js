const { Wobj } = require('models');
const _ = require('lodash');
const { processUserAffiliate } = require('../affiliateProgram/processAffiliate');
const wObjectHelper = require('../../helpers/wObjectHelper');
const { REQUIREDFILDS_WOBJ_LIST } = require('../../../constants/wobjectsData');
const campaignsV2Helper = require('../../helpers/campaignsV2Helper');
const { User } = require('../../../models');
const { SELECT_USER_CAMPAIGN_SHOP } = require('../../../constants/usersData');

const objectTypesOrder = [
  'list',
  'page',
  'product',
  'book',
  'business',
  'person',
  'hashtag',
  'newsfeed',
  'widget',
  'webpage',
  'shop',
  'affiliate',
  'restaurant',
  'dish',
  'drink',
  'service',
  'place',
  'company',
  'organization',
  'app',
  'crypto',
  'indices',
  'commodity',
  'currency',
  'stocks',
  'currencies',
  'hotel',
  'motel',
  'resort',
  'b&b',
  'car',
  'test',
];

const orderMap = new Map(objectTypesOrder.map((value, index) => [value, index]));

const sortArrayBasedOnOrder = (arrayToSort) => (
  arrayToSort.slice().sort((a, b) => orderMap.get(a) - orderMap.get(b)));

const getUserFavoritesList = async ({ userName }) => {
  const { result, error } = await Wobj.getFavoritesListByUsername({ userName });
  if (error) return { error };

  const sortedArr = sortArrayBasedOnOrder(result);

  return { result: sortedArr };
};

const getFavorites = async ({
  userName, skip, limit, objectType, app, locale, countryCode, follower,
}) => {
  const { result, error } = await Wobj.getFavoritesByUsername({
    userName, skip, limit: limit + 1, objectType,
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
