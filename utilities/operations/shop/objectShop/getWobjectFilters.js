const {
  Wobj,
} = require('models');
const { SHOP_ITEM_RATINGS } = require('constants/shop');
const shopHelper = require('utilities/helpers/shopHelper');
const _ = require('lodash');

const getObjects = async ({
  authorPermlink, tagCategory, app, path,
}) => {
  const { wobjectFilter } = await shopHelper.getWobjectFilter({ app, authorPermlink });

  const { result } = await Wobj.findObjects({
    filter: {
      ...wobjectFilter,
      ...(tagCategory && { 'fields.tagCategory': tagCategory }),
      ...(!_.isEmpty(path) && { departments: { $all: path } }),
    },
    projection: { fields: 1 },
  });

  return result;
};

const getMoreTagFilters = async ({
  authorPermlink, tagCategory, skip, limit, app, path,
}) => {
  const objects = await getObjects({
    authorPermlink, tagCategory, app, path,
  });
  const { tags, hasMore } = shopHelper.getMoreTagsForCategory({
    objects, tagCategory, skip, limit,
  });

  return {
    result: {
      tagCategory,
      tags,
      hasMore,
    },
  };
};

const getObjectFilters = async ({
  authorPermlink, app, path,
}) => {
  const { result: tagCategories, error } = await shopHelper.getTagCategoriesForFilter();
  if (error) return { error };

  const objects = await getObjects({ authorPermlink, app, path });

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
  getObjectFilters,
  getMoreTagFilters,
};
