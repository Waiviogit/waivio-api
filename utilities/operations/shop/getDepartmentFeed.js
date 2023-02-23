const _ = require('lodash');
const {
  REMOVE_OBJ_STATUSES,
  REQUIREDFILDS_WOBJ_LIST,
} = require('constants/wobjectsData');
const wObjectHelper = require('utilities/helpers/wObjectHelper');
const campaignsV2Helper = require('utilities/helpers/campaignsV2Helper');
const shopHelper = require('utilities/helpers/shopHelper');
const { Wobj } = require('models');

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

  const {
    result,
    error,
  } = await Wobj.findObjects({
    filter: {
      departments: department,
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
      ...shopHelper.makeFilterCondition(filter),
    },
    options: {
      skip,
      limit: limit + 1,
      sort: { weight: -1 },
    },
  });

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
