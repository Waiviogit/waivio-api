const shopHelper = require('utilities/helpers/shopHelper');
const {
  Wobj,
  User,
} = require('models');
const _ = require('lodash');
const wObjectHelper = require('utilities/helpers/wObjectHelper');
const {
  REQUIREDFILDS_WOBJ_LIST,
  REMOVE_OBJ_STATUSES,
} = require('constants/wobjectsData');
const campaignsV2Helper = require('utilities/helpers/campaignsV2Helper');
const { SELECT_USER_CAMPAIGN_SHOP } = require('constants/usersData');
const { UNCATEGORIZED_DEPARTMENT, OTHERS_DEPARTMENT } = require('constants/departments');
const { processAppAffiliate } = require('utilities/operations/affiliateProgram/processAffiliate');
const getWobjectDepartments = require('./getWobjectDepartments');

const getObjectDepartmentCondition = async ({
  department, path, authorPermlink, app, wobjectFilter,
}) => {
  if (department === UNCATEGORIZED_DEPARTMENT) {
    return { $or: [{ departments: [] }, { departments: null }] };
  }
  if (department === OTHERS_DEPARTMENT) {
    const { result } = await getWobjectDepartments({
      authorPermlink,
      app,
      name: department,
      wobjectFilter,
      path,
    });
    return { departments: { $in: _.map(result, 'name') } };
  }

  return { departments: { $all: path } };
};

const getWobjectDepartmentFeed = async ({
  department,
  wobjectFilter,
  app,
  authorPermlink,
  skip = 0,
  limit = 3,
  follower,
  locale,
  countryCode,
  user,
  path,
  filter,
}) => {
  path = _.filter(path, (p) => p !== OTHERS_DEPARTMENT);
  if (!user) ({ user } = await User.getOne(follower, SELECT_USER_CAMPAIGN_SHOP));
  const emptyResp = {
    department,
    wobjects: [],
    hasMore: false,
  };
  // inside departments in and condition so we can add direct filter
  if (!wobjectFilter) {
    ({ wobjectFilter } = await shopHelper.getWobjectFilter({
      app,
      authorPermlink,
      tagFilter: shopHelper.makeFilterCondition(filter),
    }));
  }

  const departmentCondition = await getObjectDepartmentCondition({
    department, path, authorPermlink, app, wobjectFilter,
  });

  const {
    wobjects: result,
    error,
  } = await Wobj.fromAggregation([
    {
      $match: {
        ...wobjectFilter,
        ...departmentCondition,
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
      },
    },
    ...shopHelper.getDefaultGroupStage({ host: app?.host }),
    { $skip: skip },
    { $limit: limit + 1 },
  ]);

  if (error) return emptyResp;
  if (_.isEmpty(result)) return emptyResp;

  const affiliateCodes = await processAppAffiliate({
    app,
    locale,
  });

  const processed = await wObjectHelper.processWobjects({
    wobjects: _.take(result, limit),
    fields: REQUIREDFILDS_WOBJ_LIST,
    reqUserName: follower,
    app,
    locale,
    countryCode,
    affiliateCodes,
  });

  await campaignsV2Helper.addNewCampaignsToObjects({
    user,
    wobjects: processed,
  });

  return {
    department,
    wobjects: processed,
    hasMore: result.length > limit,
  };
};

module.exports = getWobjectDepartmentFeed;
