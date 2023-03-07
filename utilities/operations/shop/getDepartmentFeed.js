const _ = require('lodash');
const {
  REMOVE_OBJ_STATUSES,
  REQUIREDFILDS_WOBJ_LIST,
} = require('constants/wobjectsData');
const wObjectHelper = require('utilities/helpers/wObjectHelper');
const campaignsV2Helper = require('utilities/helpers/campaignsV2Helper');
const shopHelper = require('utilities/helpers/shopHelper');
const { Wobj } = require('models');
const { UNCATEGORIZED_DEPARTMENT } = require('constants/departments');

module.exports = async ({
  countryCode,
  department = '',
  userName,
  locale,
  filter,
  limit = 3,
  skip = 0,
  user,
  app,
}) => {
  const emptyResp = { department, wobjects: [], hasMore: false };

  const departmentCondition = department === UNCATEGORIZED_DEPARTMENT
    ? { $or: [{ departments: [] }, { departments: null }] }
    : { departments: department };

  const { wobjects: result, error } = await Wobj.fromAggregation([
    {
      $match: {
        ...departmentCondition,
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
        ...shopHelper.makeFilterCondition(filter),
      },
    },
    ...shopHelper.getDefaultGroupStage(),
    { $skip: skip },
    { $limit: limit + 1 },
  ]);

  if (error) return emptyResp;
  if (_.isEmpty(result)) return emptyResp;
  const processed = await wObjectHelper.processWobjects({
    wobjects: _.take(result, limit),
    fields: REQUIREDFILDS_WOBJ_LIST,
    reqUserName: userName,
    app,
    locale,
    countryCode,
  });

  await campaignsV2Helper.addNewCampaignsToObjects({ user, wobjects: processed });

  return {
    department,
    wobjects: processed,
    hasMore: result.length > limit,
  };
};
