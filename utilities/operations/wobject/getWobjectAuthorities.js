const _ = require('lodash');
const { Wobj } = require('../../../models');
const { FIELDS_NAMES } = require('../../../constants/wobjectsData');

module.exports = async (authorPermlink) => {
  const { result, error } = await Wobj.findOne({ author_permlink: authorPermlink }, { fields: 1 });
  if (error) return { error };
  if (!result) return { result: [] };
  return { result: _.filter(result.fields, (f) => f.name === FIELDS_NAMES.AUTHORITY) };
};
