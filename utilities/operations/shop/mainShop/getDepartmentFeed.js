const _ = require('lodash');
const {
  REMOVE_OBJ_STATUSES,
  REQUIREDFILDS_WOBJ_LIST,
  SHOP_OBJECT_TYPES,
} = require('../../../../constants/wobjectsData');
const wObjectHelper = require('../../../helpers/wObjectHelper');
const campaignsV2Helper = require('../../../helpers/campaignsV2Helper');
const shopHelper = require('../../../helpers/shopHelper');
const { Wobj } = require('../../../../models');
const { UNCATEGORIZED_DEPARTMENT } = require('../../../../constants/departments');
const { processAppAffiliate } = require('../../affiliateProgram/processAffiliate');
const { isMobileDevice } = require('../../../../middlewares/context/contextHelper');
const { makeAffiliateLinksOnList } = require('../../affiliateProgram/makeAffiliateLinks');

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
  path,
}) => {
  const emptyResp = { department, wobjects: [], hasMore: false };

  const departmentCondition = department === UNCATEGORIZED_DEPARTMENT
    ? { $or: [{ departments: [] }, { departments: null }] }
    : { departments: { $all: path } };

  const { wobjects: result, error } = await Wobj.fromAggregation([
    {
      $match: {
        ...departmentCondition,
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
        ...shopHelper.makeFilterCondition(filter),
        object_type: { $in: SHOP_OBJECT_TYPES },
      },
    },
    ...shopHelper.getDefaultGroupStage(),
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
    reqUserName: userName,
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
