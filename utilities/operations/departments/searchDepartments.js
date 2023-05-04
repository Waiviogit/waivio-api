const { Department } = require('models');
const _ = require('lodash');

module.exports = async ({ searchString = '', skip, limit }) => {
  const { result, error } = await Department.find({
    // eslint-disable-next-line no-useless-escape
    filter: {
      $or: [
        { $text: { $search: `\"${searchString}\"` } },
        { name: { $regex: `^${searchString}` } },
      ],
    },
    projection: { name: 1 },
    options: { skip, limit: limit + 1 },
  });
  if (error) return { error };

  return {
    result: _.take(result, limit),
    hasMore: result.length > limit,
  };
};
