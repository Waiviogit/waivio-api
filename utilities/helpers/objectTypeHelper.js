const _ = require('lodash');
const { redisGetter } = require('utilities/redis');
const { FIELDS_NAMES } = require('constants/wobjectsData');

exports.getTagCategory = async (tagCategory = [], filter) => {
  const resultArray = [];
  for (const category of tagCategory) {
    const { tags, error } = await redisGetter.getTagCategories({ key: `${FIELDS_NAMES.TAG_CATEGORY}:${category}`, start: 0, end: 3 });
    if (error || !tags.length) continue;
    resultArray.push({ tagCategory: category, tags: tags.slice(0, 3), hasMore: tags.length > 3 });
  }
  if (_.get(filter, 'tagCategory')) {
    for (const item of filter.tagCategory) {
      const redisValues = _.find(resultArray, (el) => el.tagCategory === item.categoryName);
      if (!redisValues) return resultArray;
      if (!_.includes(redisValues.tags, item.tags[0])) {
        redisValues.tags.splice(2, 1, item.tags[0]);
      }
    }
  }
  return resultArray;
};
