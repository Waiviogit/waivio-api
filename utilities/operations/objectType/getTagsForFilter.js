const _ = require('lodash');
const { ObjectType } = require('models');
const { objectTypeHelper } = require('utilities/helpers');

module.exports = async ({ objectType }) => {
  let tagCategory = [];
  const { objectType: result, error } = await ObjectType.getOne({ name: objectType });
  if (error) return { error };
  if (_.has(result, 'supposed_updates')) {
    tagCategory = _.get(_.find(result.supposed_updates, (o) => o.name === 'tagCategory'), 'values', []);
  }
  _.get(tagCategory, 'length') ? tagCategory = await objectTypeHelper.getTagCategory(tagCategory) : null;

  return { tags: tagCategory };
};
