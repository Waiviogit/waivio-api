const _ = require('lodash');
const { Wobj } = require('../../models');
const { redisGetter } = require('../redis');
const { FIELDS_NAMES } = require('../../constants/wobjectsData');
const { processWobjects } = require('./wObjectHelper');

exports.getTagCategory = async (tagCategory = [], filter, type) => {
  const resultArray = [];
  for (const category of tagCategory) {
    const { tags, error } = await redisGetter.getTagCategories({ key: `${FIELDS_NAMES.TAG_CATEGORY}:${type}:${category}`, start: 0, end: 3 });
    if (error || !tags.length) continue;
    resultArray.push({
      tagCategory: category, tags: tags.slice(0, 3), hasMore: tags.length > 3, type,
    });
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

exports.getTagsByTagCategory = async ({ wobjectLinks, tagCategory, app }) => {
  const { result } = await Wobj.find({ author_permlink: { $in: wobjectLinks } });
  const wobjects = await processWobjects({
    fields: [FIELDS_NAMES.TAG_CATEGORY, FIELDS_NAMES.CATEGORY_ITEM],
    wobjects: result,
    app,
  });

  return _.reduce(tagCategory, (resultArr, categoryName) => {
    const tags = _
      .chain(wobjects)
      .reduce((accum, element) => {
        _.forEach(_.get(element, 'tagCategory', []), (tag) => {
          const filtered = _.filter(_.get(tag, 'items', []), (filterItem) => filterItem.weight > 0);
          if (tag.body === categoryName && !_.isEmpty(filtered)) accum = [...accum, ...filtered];
        });
        return accum;
      }, [])
      .orderBy(['weight'], ['desc'])
      .map('body')
      .uniq()
      .value();
    return [...resultArr, { tagCategory: categoryName, tags }];
  }, []);
};
