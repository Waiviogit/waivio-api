const _ = require('lodash');
const {
  Wobj, User,
} = require('../../../../models');
const {
  REMOVE_OBJ_STATUSES,
  REQUIREDFILDS_WOBJ_LIST,
} = require('../../../../constants/wobjectsData');
const { SELECT_USER_CAMPAIGN_SHOP } = require('../../../../constants/usersData');
const shopHelper = require('../../../helpers/shopHelper');
const wObjectHelper = require('../../../helpers/wObjectHelper');
const campaignsV2Helper = require('../../../helpers/campaignsV2Helper');
const { UNCATEGORIZED_DEPARTMENT, OTHERS_DEPARTMENT } = require('../../../../constants/departments');
const { processUserAffiliate, processAppAffiliate } = require('../../affiliateProgram/processAffiliate');
const getUserDepartments = require('./getUserDepartments');
const { SHOP_SCHEMA } = require('../../../../constants/shop');
const { isMobileDevice } = require('../../../../middlewares/context/contextHelper');
const { makeAffiliateLinksOnList } = require('../../affiliateProgram/makeAffiliateLinks');

const getUserDepartmentCondition = async ({
  department, path, userName, userFilter, app, schema,
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
      schema,
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

  if (!userFilter) userFilter = await shopHelper.getUserFilter({ userName, app, schema });
  if (!user) ({ user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP));

  const departmentCondition = await getUserDepartmentCondition({
    department, path, userName, userFilter, app, schema,
  });
  const objectTypeCondition = shopHelper.getObjectTypeCondition(schema);
  const { host = '' } = app;

  const pipe = [
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
  ];

  if (schema === SHOP_SCHEMA.SHOP) {
    pipe.push(...shopHelper.getDefaultGroupStage({ host }));
  } else {
    pipe.push(...Wobj.getSortingStagesByHost({ host }));
  }
  pipe.push(
    { $skip: skip },
    { $limit: limit + 1 },
  );

  const { wobjects: result, error } = await Wobj.fromAggregation(pipe);

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
    mobile: isMobileDevice(),
  });

  await campaignsV2Helper.addNewCampaignsToObjects({ user, wobjects: processed });

  const objectsWithCodes = makeAffiliateLinksOnList({
    objects: processed,
    countryCode,
    affiliateCodes,
  });

  return {
    department,
    wobjects: objectsWithCodes,
    hasMore: result.length > limit,
  };
};
