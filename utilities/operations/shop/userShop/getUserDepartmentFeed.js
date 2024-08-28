const _ = require('lodash');
const {
  Wobj, User,
} = require('models');
const {
  REMOVE_OBJ_STATUSES,
  REQUIREDFILDS_WOBJ_LIST,
  SHOP_OBJECT_TYPES,
} = require('constants/wobjectsData');
const { SELECT_USER_CAMPAIGN_SHOP } = require('constants/usersData');
const shopHelper = require('utilities/helpers/shopHelper');
const wObjectHelper = require('utilities/helpers/wObjectHelper');
const campaignsV2Helper = require('utilities/helpers/campaignsV2Helper');
const { UNCATEGORIZED_DEPARTMENT, OTHERS_DEPARTMENT } = require('constants/departments');
const { processUserAffiliate, processAppAffiliate } = require('utilities/operations/affiliateProgram/processAffiliate');
const getUserDepartments = require('./getUserDepartments');

const getUserDepartmentCondition = async ({
  department, path, userName, userFilter, app,
}) => {
  if (department === UNCATEGORIZED_DEPARTMENT) {
    return { $or: [{ departments: [] }, { departments: null }] };
  }
  if (department === OTHERS_DEPARTMENT) {
    const { result } = await getUserDepartments.getTopDepartments({
      userName,
      name: department,
      path,
      userFilter,
      app,
    });
    return { departments: { $in: _.map(result, 'name') } };
  }

  return { departments: { $all: path } };
};

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
  follower,
  path,
  userFilter,
  schema,
}) => {
  path = _.filter(path, (p) => p !== OTHERS_DEPARTMENT);
  const emptyResp = { department, wobjects: [], hasMore: false };

  if (!userFilter) userFilter = await shopHelper.getUserFilter({ userName, app });
  if (!user) ({ user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP));

  const departmentCondition = await getUserDepartmentCondition({
    department, path, userName, userFilter, app,
  });
  const objectTypeCondition = shopHelper.getObjectTypeCondition(schema);

  const { wobjects: result, error } = await Wobj.fromAggregation([
    {
      $match: {
        ...departmentCondition,
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
        ...objectTypeCondition,
        $and: [
          userFilter,
          shopHelper.makeFilterCondition(filter),
        ],
      },
    },
    ...shopHelper.getDefaultGroupStage(),
    { $skip: skip },
    { $limit: limit + 1 },
  ]);

  if (error) return emptyResp;
  if (_.isEmpty(result)) return emptyResp;

  let affiliateCodes = await processUserAffiliate({
    app,
    locale,
    creator: userName,
  });
  if (!affiliateCodes?.length) {
    affiliateCodes = await processAppAffiliate({
      app,
      locale,
    });
  }

  const processed = await wObjectHelper.processWobjects({
    wobjects: _.take(result, limit),
    fields: REQUIREDFILDS_WOBJ_LIST,
    reqUserName: follower,
    app,
    locale,
    countryCode,
    affiliateCodes,
  });

  await campaignsV2Helper.addNewCampaignsToObjects({ user, wobjects: processed });

  return {
    department,
    wobjects: processed,
    hasMore: result.length > limit,
  };
};
