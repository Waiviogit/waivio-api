const _ = require('lodash');
const { ObjectType } = require('models');
const { objectTypeHelper } = require('utilities/helpers');

module.exports = async ({ objectType, wobjectLinks }) => {
  let tagCategory = [];
  const { objectType: result, error } = await ObjectType.getOne({ name: objectType });
  if (error) return { error };
  if (_.has(result, 'supposed_updates')) {
    tagCategory = _.get(_.find(result.supposed_updates, (o) => o.name === 'tagCategory'), 'values', []);
  }
  if (_.isEmpty(tagCategory)) return { tags: [] };
  if (!_.isEmpty(wobjectLinks)) {
    return { tags: await objectTypeHelper.getTagsByTagCategory({ wobjectLinks, tagCategory }) };
  }

  return { tags: await objectTypeHelper.getTagCategory(tagCategory) };
};
