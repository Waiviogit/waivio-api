const _ = require('lodash');
const { ObjectType } = require('../../../models');
const { objectTypeHelper } = require('../../helpers');

module.exports = async ({ objectType, wobjectLinks, app }) => {
  let tagCategory = [];
  const { objectType: result, error } = await ObjectType.getOne({ name: objectType });
  if (error) return { error };
  if (_.has(result, 'supposed_updates')) {
    tagCategory = _.get(_.find(result.supposed_updates, (o) => o.name === 'tagCategory'), 'values', []);
  }
  if (_.isEmpty(tagCategory)) return { tags: [] };
  if (!_.isEmpty(wobjectLinks)) {
    return {
      tags: await objectTypeHelper.getTagsByTagCategory({
        wobjectLinks, tagCategory, app,
      }),
    };
  }

  return { tags: await objectTypeHelper.getTagCategory(tagCategory) };
};
