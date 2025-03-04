const _ = require('lodash');
const { REQUIREDFIELDS_POST } = require('../../../constants/wobjectsData');
const { wobjectSubscriptions, Wobj } = require('../../../models');

module.exports = async (value) => {
  const { wobjects = [] } = await wobjectSubscriptions.getFollowings({ follower: value.name });
  if (!wobjects.length) return { wobjects };
  const { result, error } = await Wobj.find(
    { author_permlink: { $in: wobjects } },
    '-_id',
    { weight: -1 },
    value.skip,
    value.limit,
  );
  if (error) return { error };
  result.forEach((wObject) => {
    wObject.fields = _.filter(wObject.fields,
      (field) => _.includes(REQUIREDFIELDS_POST, field.name));
  });
  return { wobjects: result };
};
