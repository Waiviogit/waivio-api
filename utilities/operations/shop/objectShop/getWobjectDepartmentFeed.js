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
const { UNCATEGORIZED_DEPARTMENT } = require('../../../../constants/departments');

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

  const departmentCondition = department === UNCATEGORIZED_DEPARTMENT
    ? { $or: [{ departments: [] }, { departments: null }] }
    : { departments: { $all: path } };

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
    ...shopHelper.getDefaultGroupStage(),
    { $skip: skip },
    { $limit: limit + 1 },
  ]);

  if (error) return emptyResp;
  if (_.isEmpty(result)) return emptyResp;
  const processed = await wObjectHelper.processWobjects({
    wobjects: _.take(result, limit),
    fields: REQUIREDFILDS_WOBJ_LIST,
    reqUserName: follower,
    app,
    locale,
    countryCode,
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
