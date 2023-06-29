const _ = require('lodash');
const {
  Wobj,
} = require('models');
const {
  SHOP_OBJECT_TYPES,
  REMOVE_OBJ_STATUSES,
} = require('constants/wobjectsData');
const shopHelper = require('utilities/helpers/shopHelper');
const { SHOP_ITEM_RATINGS } = require('constants/shop');

const getUserObjects = async ({
  userName, tagCategory, path, app,
}) => {
  const userFilter = await shopHelper.getUserFilter({ userName, app });

  const { result } = await Wobj.findObjects({
    filter: {
      ...userFilter,
      object_type: { $in: SHOP_OBJECT_TYPES },
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
      ...(!_.isEmpty(path) && { departments: { $all: path } }),
      ...(tagCategory && { 'fields.tagCategory': tagCategory }),
    },
    projection: { fields: 1 },
  });

  return result;
};

const getMoreTagFilters = async ({
  userName, tagCategory, skip, limit, path, app,
}) => {
  const objects = await getUserObjects({
    userName, tagCategory, app, path,
  });

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
  userName, path, app,
}) => {
  const { result: tagCategories, error } = await shopHelper.getTagCategoriesForFilter();
  if (error) return { error };

  const objects = await getUserObjects({ userName, path, app });

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
