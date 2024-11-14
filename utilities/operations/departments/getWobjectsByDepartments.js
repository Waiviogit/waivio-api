const { Wobj, User } = require('models');
const { REMOVE_OBJ_STATUSES } = require('constants/wobjectsData');
const shopHelper = require('utilities/helpers/shopHelper');
const _ = require('lodash');
const campaignsV2Helper = require('utilities/helpers/campaignsV2Helper');
const { SELECT_USER_CAMPAIGN_SHOP } = require('constants/usersData');
const { SHOP_SCHEMA } = require('../../../constants/shop');
const {
  getAppAuthorities,
  isInheritedApp,
} = require('../../helpers/appHelper');

module.exports = async ({
  departments, skip, limit, userName = '', schema, app,
}) => {
  const inheritedApp = isInheritedApp(app);

  const pipe = [
    {
      $match: {
        departments: { $in: departments },
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
      },
    },
  ];
  if (inheritedApp) {
    pipe.push({
      $match: {
        $or: [
          {
            'authority.administrative': { $in: getAppAuthorities(app) },
          },
        ],
      },
    });
  }

  if (schema === SHOP_SCHEMA.SHOP) {
    pipe.push(...shopHelper.getDefaultGroupStage());
  } else {
    pipe.push({ $sort: { weight: -1, createdAt: -1 } });
  }

  pipe.push(
    { $skip: skip },
    { $limit: limit + 1 },
  );

  const { wobjects: result, error } = await Wobj.fromAggregation(pipe);
  if (error) return { error };

  const { user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP);
  await campaignsV2Helper.addNewCampaignsToObjects({ user, wobjects: result });

  return { wobjects: _.take(result, limit), hasMore: result.length > limit };
};
