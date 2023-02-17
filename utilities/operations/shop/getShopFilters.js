const { ObjectType } = require('models');
const _ = require('lodash');
const { objectTypeHelper } = require('utilities/helpers');
const { OBJECT_TYPES } = require('constants/wobjectsData');

module.exports = async () => {
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
    rating: [6, 8, 10],
    tagCategoryFilters,
  };
};
