const _ = require('lodash');
const { FIELDS_NAMES } = require('constants/wobjectsData');

const makeFilterCondition = (filter = {}) => {
  const result = {};
  if (_.get(filter, FIELDS_NAMES.TAG_CATEGORY)) {
    const condition = [];
    for (const category of filter.tagCategory) {
      condition.push({
        fields: {
          $elemMatch: {
            name: FIELDS_NAMES.CATEGORY_ITEM,
            body: { $in: category.tags },
            tagCategory: category.categoryName,
            weight: { $gte: 0 },
          },
        },
      });
    }

    if (condition.length) result.$or = condition;
  }
  if (filter.rating) {
    result.fields = { $elemMatch: { average_rating_weight: { $gte: filter.rating } } };
  }
  return result;
};

module.exports = {
  makeFilterCondition,
};
