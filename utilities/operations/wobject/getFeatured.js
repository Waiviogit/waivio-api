const { FIELDS_NAMES, OBJECT_TYPES } = require('@waivio/objects-processor');
const _ = require('lodash');
const { Wobj, User } = require('../../../models');
const wObjectHelper = require('../../helpers/wObjectHelper');
const { checkForSocialSite, getAppAuthorities } = require('../../helpers/appHelper');
const { isMobileDevice } = require('../../../middlewares/context/contextHelper');
const { REMOVE_OBJ_STATUSES, REQUIREDFILDS_WOBJ_LIST } = require('../../../constants/wobjectsData');
const { SELECT_USER_CAMPAIGN_SHOP } = require('../../../constants/usersData');
const { processAppAffiliate } = require('../affiliateProgram/processAffiliate');
const { addNewCampaignsToObjects } = require('../../helpers/campaignsV2Helper');

const getFeatured = async ({
  app,
  locale,
  countryCode,
  userName,
  authorPermlink,
  skip,
  limit,
}) => {
  const { result, error } = await Wobj.findOne({
    author_permlink: authorPermlink,
    object_type: { $in: [OBJECT_TYPES.PERSON, OBJECT_TYPES.BUSINESS] },
  });
  if (!result || error) return { wobjects: [], hasMore: false };

  const object = await wObjectHelper.processWobjects({
    wobjects: [result],
    fields: [FIELDS_NAMES.FEATURED],
    app,
    returnArray: false,
    locale,
  });

  const permlinks = _.map(object?.featured, 'body');
  const social = checkForSocialSite(app?.parentHost ?? '');
  const authorities = getAppAuthorities(app);

  const { wobjects: featuredObjects = [] } = await Wobj.fromAggregation([
    {
      $match: {
        author_permlink: { $in: permlinks },
        ...(social && { 'authority.administrative': { $in: authorities } }),
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
      },
    },
    { $addFields: { __order: { $indexOfArray: [permlinks, '$author_permlink'] } } },
    { $sort: { __order: 1 } },
    { $skip: skip },
    { $limit: limit + 1 },
  ]);

  const { user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP);
  await addNewCampaignsToObjects({ user, wobjects: featuredObjects });

  const affiliateCodes = await processAppAffiliate({
    app,
    locale,
  });

  const processed = await wObjectHelper.processWobjects({
    wobjects: featuredObjects,
    fields: REQUIREDFILDS_WOBJ_LIST,
    app,
    returnArray: true,
    locale,
    countryCode,
    reqUserName: userName,
    affiliateCodes,
    mobile: isMobileDevice(),
  });

  return {
    wobjects: _.take(processed, limit),
    hasMore: featuredObjects.length > limit,
  };
};

module.exports = getFeatured;
