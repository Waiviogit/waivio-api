const _ = require('lodash');
const {
  Wobj,
} = require('models');
const {
  REMOVE_OBJ_STATUSES,
} = require('constants/wobjectsData');
const shopHelper = require('utilities/helpers/shopHelper');
const { SHOP_ITEM_RATINGS } = require('constants/shop');

const getUserObjects = async ({
  userName, tagCategory, path, app, schema,
}) => {
  const userFilter = await shopHelper.getUserFilter({ userName, app });

  const objectTypeCondition = shopHelper.getObjectTypeCondition(schema);

  const { wobjects } = await Wobj.fromAggregation([{
    $match: {
      ...userFilter,
      ...objectTypeCondition,
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
      ...(!_.isEmpty(path) && { departments: { $all: path } }),
      ...(tagCategory ? { 'fields.tagCategory': tagCategory } : { 'fields.tagCategory': { $exists: true } }),
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
  userName, tagCategory, skip, limit, path, app, schema,
}) => {
  const objects = await getUserObjects({
    userName, tagCategory, app, path, schema,
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
  userName, path, app, schema,
}) => {
  const { result: tagCategories, error } = await shopHelper.getTagCategoriesForFilter();
  if (error) return { error };

  const tags = await getUserObjects({
    userName, path, app, schema,
  });

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
  getUserFilters,
  getMoreTagFilters,
};
