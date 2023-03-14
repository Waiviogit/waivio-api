const _ = require('lodash');
const {
  User,
  Post,
  userShopDeselectModel,
  Wobj,
} = require('models');
const { SELECT_USER_CAMPAIGN_SHOP } = require('constants/usersData');
const {
  SHOP_OBJECT_TYPES,
  REMOVE_OBJ_STATUSES,
} = require('constants/wobjectsData');
const shopHelper = require('utilities/helpers/shopHelper');
const { SHOP_ITEM_RATINGS } = require('constants/shop');

const getUserObjects = async ({ userName, tagCategory, path }) => {
  const { user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP);
  const hideLinkedObjects = _.get(user, 'user_metadata.settings.shop.hideLinkedObjects', false);
  const wobjectsFromPosts = await Post.getProductLinksFromPosts({ userName });

  const orFilter = [
    { 'authority.ownership': userName },
    { 'authority.administrative': userName },
  ];
  if (!_.isEmpty(wobjectsFromPosts) && !hideLinkedObjects) {
    orFilter.push({ author_permlink: { $in: wobjectsFromPosts } });
  }

  const deselectLinks = await userShopDeselectModel.findUsersLinks({ userName });

  const { result } = await Wobj.findObjects({
    filter: {
      $or: orFilter,
      object_type: { $in: SHOP_OBJECT_TYPES },
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
      ...(!_.isEmpty(deselectLinks) && { author_permlink: { $nin: deselectLinks } }),
      ...(!_.isEmpty(path) && { departments: { $all: path } }),
      ...(tagCategory && { 'fields.tagCategory': tagCategory }),
    },
    projection: { fields: 1 },
  });

  return result;
};

const getMoreTagFilters = async ({
  userName, tagCategory, skip, limit, path,
}) => {
  const objects = await getUserObjects({ userName, tagCategory });

  const { tags, hasMore } = shopHelper.getMoreTagsForCategory({
    objects, tagCategory, skip, limit, path,
  });

  return {
    result: {
      tagCategory,
      tags,
      hasMore,
    },
  };
};

const getUserFilters = async ({
  userName, path,
}) => {
  const { result: tagCategories, error } = await shopHelper.getTagCategoriesForFilter();
  if (error) return { error };

  const objects = await getUserObjects({ userName, path });

  const tagCategoryFilters = shopHelper
    .getFilteredTagCategories({ objects, tagCategories });

  return {
    result: {
      rating: SHOP_ITEM_RATINGS,
      tagCategoryFilters,
    },
  };
};

module.exports = {
  getUserFilters,
  getMoreTagFilters,
};
