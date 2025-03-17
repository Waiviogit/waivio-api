const _ = require('lodash');
const { ObjectType } = require('../../../../models');
const { objectTypeHelper } = require('../../../helpers');
const { OBJECT_TYPES, FIELDS_NAMES } = require('../../../../constants/wobjectsData');
const { SHOP_ITEM_RATINGS } = require('../../../../constants/shop');
const shopHelper = require('../../../helpers/shopHelper');
const { redisGetter } = require('../../../redis');
const showTags = require('../../objectType/showTags');

const getMainFilter = async () => {
  const tagCategoryFilters = [];
  const { result, error } = await ObjectType
    .find({ filter: { name: { $in: [OBJECT_TYPES.PRODUCT, OBJECT_TYPES.BOOK] } } });
  if (_.isEmpty(result)) return { error: { status: 404, message: 'Object types not found' } };
  if (error) return { error };

  for (const resultElement of result) {
    const tagCategory = _.get(_.find(resultElement.supposed_updates, (o) => o.name === 'tagCategory'), 'values', []);
    tagCategoryFilters.push(...await objectTypeHelper.getTagCategory(tagCategory, '', resultElement.name));
  }

  return {
    result: {
      rating: SHOP_ITEM_RATINGS,
      tagCategoryFilters,
    },
  };
};

const getCategoryTags = async ({
  path, tagCategory, skip = 0, limit = 3,
}) => {
  let tags = [];
  for (const department of path) {
    const { tags: categoryTags, error } = await redisGetter.getTagCategories({ key: `${FIELDS_NAMES.DEPARTMENTS}:${department}:${tagCategory}`, start: 0, end: -1 });
    if (error) continue;
    tags = _.difference(categoryTags, tags);
  }
  const result = _.slice(tags, skip, skip + limit);
  return {
    tagCategory,
    tags: result,
    hasMore: tags.length > result + skip,
  };
};

const getFilters = async ({ path = [] } = {}) => {
  if (_.isEmpty(path)) return getMainFilter();
  const { result: tagCategories } = await shopHelper.getTagCategoriesForFilter();

  const tagCategoryFilters = [];
  for (const tagCategory of tagCategories) {
    const { tags, hasMore } = await getCategoryTags({ path, tagCategory });
    if (_.isEmpty(tags)) continue;
    tagCategoryFilters.push({ tagCategory, tags, hasMore });
  }

  return {
    result: {
      rating: SHOP_ITEM_RATINGS,
      tagCategoryFilters,
    },
  };
};

const getMoreTagFilters = async ({
  tagCategory, skip, limit, path,
}) => {
  if (_.isEmpty(path)) {
    const result = await showTags({
      skip, limit, tagCategory, objectType: tagCategory === 'Tags' ? OBJECT_TYPES.BOOK : OBJECT_TYPES.PRODUCT,
    });
    return {
      result: {
        ...result,
        tagCategory,
      },
    };
  }
  return {
    result: await getCategoryTags({
      path, tagCategory, skip, limit,
    }),
  };
};

module.exports = {
  getFilters,
  getMoreTagFilters,
};
