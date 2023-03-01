const { Wobj } = require('models');
const { REMOVE_OBJ_STATUSES } = require('constants/wobjectsData');
const shopHelper = require('utilities/helpers/shopHelper');
const _ = require('lodash');

module.exports = async ({ departments, skip, limit }) => {
  const { wobjects: result, error } = await Wobj.fromAggregation([
    {
      $match: {
        departments: { $in: departments },
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
      },
    },
    ...shopHelper.getDefaultGroupStage(),
    { $skip: skip },
    { $limit: limit + 1 },
  ]);
  if (error) return { error };

  return { wobjects: _.take(result, limit), hasMore: result.length > limit };
};
