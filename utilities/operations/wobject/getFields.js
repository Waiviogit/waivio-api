const _ = require('lodash');
const { Wobj } = require('models');

// eslint-disable-next-line camelcase
module.exports = async ({ author_permlink, fields_names, custom_fields }) => {
  const pipeline = [
    { $match: { author_permlink } },
    { $unwind: '$fields' },
    { $replaceRoot: { newRoot: '$fields' } },
  ];

  if (!_.isEmpty(fields_names)) {
    // eslint-disable-next-line camelcase
    pipeline.push({ $match: { name: { $in: [...fields_names] } } });
  }
  if (!_.isEmpty(custom_fields)) {
    const cond = {};

    // eslint-disable-next-line camelcase
    for (const key in custom_fields) {
      cond[key] = custom_fields[key];
    }
    pipeline.push({ $match: cond });
  }
  const { wobjects: fields, error } = await Wobj.fromAggregation(pipeline);

  return { fields, error };
};
