const { ObjectType } = require('models');
const _ = require('lodash');
const { objectTypeHelper } = require('utilities/helpers');
const { OBJECT_TYPES } = require('constants/wobjectsData');
const shopHelper = require('utilities/helpers/shopHelper');

const getFilters = async ({ path = [] } = {}) => {
  // cash просчитывать
  /// писаться будут не через сash

  const { result: tagCategories } = await shopHelper.getTagCategoriesForFilter();
  console.log();
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
      // todo const
      rating: [10, 8, 6],
      tagCategoryFilters,
    },
  };
};

(async () => {
  // await getFilters({ path: ['Books', 'fiction', 'baby fiction'] });
  // console.log();

  const path = ['Books', 'cooking', 'oldFiction'];

  const mock = {
    Books: ['tag1', 'tag2', 'tag3'], // 1 lvl
    cooking: ['tag1', 'tag2'], // 2 lvl
    fiction: ['tag2', 'tag3'], // 2 lvl
    'baby fiction': ['tag3', 'tag6'], // 3 lvl
    oldFiction: ['tag2'], // 3 lvl

  };

  let tags = [];
  for (const item of path) {
    tags = _.difference(mock[item], tags);
  }
  console.log();
})();

module.exports = {
  getFilters,
};
