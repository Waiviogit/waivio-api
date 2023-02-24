const shopHelper = require('utilities/helpers/shopHelper');
const { Wobj, User } = require('models');
const _ = require('lodash');
const wObjectHelper = require('utilities/helpers/wObjectHelper');
const { REQUIREDFILDS_WOBJ_LIST } = require('constants/wobjectsData');
const campaignsV2Helper = require('utilities/helpers/campaignsV2Helper');
const { SELECT_USER_CAMPAIGN_SHOP } = require('constants/usersData');

const getWobjectDepartmentFeed = async ({
  department, filter, app, authorPermlink, skip = 0, limit = 3, follower, locale, countryCode, user,
}) => {
  if (!user) ({ user } = await User.getOne(follower, SELECT_USER_CAMPAIGN_SHOP));
  const emptyResp = { department, wobjects: [], hasMore: false };
  // inside departments in and condition so we can add direct filter
  if (!filter)({ filter } = await shopHelper.getWobjectFilter({ app, authorPermlink }));
  const { result, error } = await Wobj.findObjects({
    filter: {
      ...filter,
      departments: department,
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
    reqUserName: follower,
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

module.exports = getWobjectDepartmentFeed;
