const _ = require('lodash');
const { CAMPAIGN_STATUSES } = require('../../../constants/campaignsData');
const { Wobj, Campaign } = require('../../../models');
const { addCampaignsToWobjects } = require('../../helpers/campaignsHelper');
const searchHelper = require('../../helpers/searchHelper');
const { REMOVE_OBJ_STATUSES } = require('../../../constants/wobjectsData');
const { ERROR_OBJ } = require('../../../constants/common');

exports.getObjectsByRequired = async ({
  requiredObject, skip, limit, app,
}) => {
  const campaignPipe = makeCampaignObjectsPipe({ requiredObject });
  const { result: links, error } = await Campaign.aggregate(campaignPipe);
  const permlinksArr = _.get(links, '[0].objects');
  if (error || _.isEmpty(permlinksArr)) return { error: ERROR_OBJ.NOT_FOUND };
  const objectsPipe = await makeObjectsPipe({
    app, permlinksArr, skip, limit,
  });
  const { wobjects: result, error: wobjError } = await Wobj.fromAggregation(objectsPipe);
  if (_.isEmpty(result) || wobjError) return { error: ERROR_OBJ.NOT_FOUND };
  const wobjects = await addCampaignsToWobjects({ wobjects: result, app });

  return {
    wobjects: _.take(wobjects, limit),
    hasMore: wobjects.length > limit,
  };
};

const makeCampaignObjectsPipe = ({ requiredObject }) => [
  {
    $match: { requiredObject, status: CAMPAIGN_STATUSES.ACTIVE },
  },
  {
    $project: { objects: 1 },
  },
  {
    $unwind: { path: '$objects' },
  },
  {
    $group: { _id: null, objects: { $addToSet: '$objects' } },
  },
];

const makeObjectsPipe = async ({
  app, permlinksArr, skip, limit,
}) => {
  const { supportedTypes, crucialWobjects, forSites } = await searchHelper.getAppInfo({ app });
  return [
    {
      $match: {
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
        ...(!_.isEmpty(supportedTypes) && { object_type: { $in: supportedTypes } }),
        ...(forSites && { author_permlink: { $in: crucialWobjects } }),
      },
    },
    {
      $match: { author_permlink: { $in: permlinksArr } },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit + 1,
    },
  ];
};
