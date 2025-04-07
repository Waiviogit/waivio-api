const { Wobj } = require('../../../models');
const { checkForSocialSite } = require('../../helpers/sitesHelper');
const { getAppAuthorities } = require('../../helpers/appHelper');
const { REMOVE_OBJ_STATUSES } = require('../../../constants/wobjectsData');

const SEARCH_TYPE = {
  GENERAL: 'GENERAL',
  DINING: 'DINING',
  SOCIAL: 'SOCIAL',
};

const getSearchType = (app) => {
  if (!app.inherited) return SEARCH_TYPE.GENERAL;
  const social = checkForSocialSite(app?.parentHost ?? '');
  if (social) return SEARCH_TYPE.SOCIAL;
  return SEARCH_TYPE.DINING;
};

const searchCondition = {
  [SEARCH_TYPE.GENERAL]: (app) => ({}),
  [SEARCH_TYPE.DINING]: (app) => ({
    author_permlink: { $in: app?.supported_objects || [] },
  }),
  [SEARCH_TYPE.SOCIAL]: (app) => ({
    'authority.administrative': { $in: getAppAuthorities(app) },
  }),
};

const getWithActiveCampaigns = async ({
  skip,
  limit,
  app,
  objectType,
}) => {
  const searchType = getSearchType(app);
  const condition = searchCondition[searchType](app);

  const pipe = [
    {
      $match: {
        ...(objectType && { object_type: objectType }),
        ...condition,
        activeCampaignsCount: { $gt: 0 },
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
      },
    },
    {
      $sort: {
        weight: -1,
        _id: -1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit + 1,
    },
  ];

  const { wobjects, error } = await Wobj.fromAggregation(pipe);

  if (error) return { wobjects: [], hasMore: false };

  return { wobjects: wobjects.slice(0, limit), hasMore: wobjects?.length > limit };
};

module.exports = getWithActiveCampaigns;
