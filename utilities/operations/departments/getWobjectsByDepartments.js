const { Wobj } = require('models');
const { REMOVE_OBJ_STATUSES } = require('constants/wobjectsData');
const _ = require('lodash');

module.exports = async ({ departments, skip, limit }) => {
  const { result, error } = await Wobj.findObjects({
    filter: {
      'status.title': {
        $nin: REMOVE_OBJ_STATUSES,
      },
      departments: { $in: departments },
    },
    options: { skip, limit: limit + 1 },
  });
  if (error) return { error };

  return { wobjects: _.take(result, limit), hasMore: result.length > limit };
};
