const _ = require('lodash');
const { Wobj, Post, User } = require('models');
const {
  REMOVE_OBJ_STATUSES,
  REQUIREDFILDS_WOBJ_LIST,
} = require('constants/wobjectsData');
const { SELECT_USER_CAMPAIGN_SHOP } = require('constants/usersData');
const shopHelper = require('utilities/helpers/shopHelper');
const wObjectHelper = require('utilities/helpers/wObjectHelper');
const campaignsV2Helper = require('utilities/helpers/campaignsV2Helper');

module.exports = async ({
  countryCode,
  department = '',
  userName,
  locale,
  filter,
  limit = 3,
  skip = 0,
  user,
  app,
  wobjectsFromPosts,
  follower,
}) => {
  const emptyResp = { department, wobjects: [], hasMore: false };

  if (!wobjectsFromPosts) {
    wobjectsFromPosts = await Post.getProductLinksFromPosts({ userName });
  }
  if (!user) ({ user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP));
  const hideLinkedObjects = _.get(user, 'user_metadata.settings.shop.hideLinkedObjects', false);

  const orFilter = [
    { 'authority.ownership': userName },
    { 'authority.administrative': userName },
  ];

  if (!_.isEmpty(wobjectsFromPosts) && !hideLinkedObjects) {
    orFilter.push({ author_permlink: { $in: wobjectsFromPosts } });
  }

  const {
    result,
    error,
  } = await Wobj.findObjects({
    filter: {
      departments: department,
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
      ...shopHelper.makeFilterCondition(filter),
      $or: orFilter,
    },
    options: {
      skip,
      limit: limit + 1,
      sort: { weight: -1 },
    },
  });

  if (error) return emptyResp;
  if (_.isEmpty(result)) return emptyResp;
  const processed = await wObjectHelper.processWobjects({
    wobjects: _.take(result, limit),
    fields: REQUIREDFILDS_WOBJ_LIST,
    reqUserName: follower,
    app,
    locale,
    countryCode,
  });

  await campaignsV2Helper.addNewCampaignsToObjects({ user, wobjects: processed });

  return {
    department,
    wobjects: processed,
    hasMore: result.length > limit,
  };
};
