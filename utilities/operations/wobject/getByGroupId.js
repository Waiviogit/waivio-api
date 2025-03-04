const _ = require('lodash');
const { Wobj, User } = require('../../../models');
const { FIELDS_NAMES, REMOVE_OBJ_STATUSES } = require('../../../constants/wobjectsData');
const campaignsV2Helper = require('../../helpers/campaignsV2Helper');
const { SELECT_USER_CAMPAIGN_SHOP } = require('../../../constants/usersData');

const getByGroupId = async ({
  groupId, skip, limit, userName = '',
}) => {
  const { result: wobjects, error: wobjError } = await Wobj.find(
    {
      fields: {
        $elemMatch:
        {
          name: FIELDS_NAMES.GROUP_ID,
          body: groupId,
          weight: { $gt: 0 },
        },
      },
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
    },
    {
      search: 0,
    },
    {},
    skip,
    limit + 1,
  );

  if (wobjError) return { error: wobjError };
  const { user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP);
  await campaignsV2Helper.addNewCampaignsToObjects({ user, wobjects });

  return {
    wobjects: _.take(wobjects, limit),
    hasMore: wobjects.length > limit,
  };
};

module.exports = getByGroupId;
