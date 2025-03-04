const {
  Wobj,
} = require('../../../../models');
const { SHOP_ITEM_RATINGS } = require('../../../../constants/shop');
const shopHelper = require('../../../helpers/shopHelper');
const _ = require('lodash');

const getObjects = async ({
  authorPermlink, tagCategory, app, path,
}) => {
  const { wobjectFilter, error } = await shopHelper.getWobjectFilter({ app, authorPermlink });
  if (error) return [];

  const { wobjects = [] } = await Wobj.fromAggregation([{
    $match: {
      ...wobjectFilter,
      ...(tagCategory ? { 'fields.tagCategory': tagCategory } : { 'fields.tagCategory': { $exists: true } }),
      ...(!_.isEmpty(path) && { departments: { $all: path } }),
    },
  },
  {
    $unwind: {
      path: '$fields',
    },
  },
  {
    $match: {
      'fields.tagCategory': tagCategory || { $exists: true },
    },
  },
  {
    $group: {
      _id: '$fields.tagCategory',
      tags: { $addToSet: '$fields.body' },
    },
  },
  {
    $project: {
      tagCategory: '$_id',
      tags: 1,
    },
  },
  ]);

  return wobjects;
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

  const tags = await getObjects({ authorPermlink, app, path });

  const tagCategoryFilters = shopHelper
    .getFilteredTagCategories({ tags, tagCategories });

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
