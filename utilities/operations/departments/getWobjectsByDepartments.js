const { Wobj, User } = require('models');
const { REMOVE_OBJ_STATUSES } = require('constants/wobjectsData');
const shopHelper = require('utilities/helpers/shopHelper');
const _ = require('lodash');
const campaignsV2Helper = require('utilities/helpers/campaignsV2Helper');
const { SELECT_USER_CAMPAIGN_SHOP } = require('constants/usersData');

module.exports = async ({
  departments, skip, limit, userName = '',
}) => {
  const { wobjects: result, error } = await Wobj.fromAggregation([
    {
      $match: {
        departments: { $in: departments },
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
      },
    },
    ...shopHelper.getDefaultGroupStage(),
    { $skip: skip },
    { $limit: limit + 1 },
  ]);
  if (error) return { error };

  const { user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP);
  await campaignsV2Helper.addNewCampaignsToObjects({ user, wobjects: result });

  return { wobjects: _.take(result, limit), hasMore: result.length > limit };
};
