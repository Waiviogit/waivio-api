const { Wobj } = require('models');
const { FIELDS_NAMES } = require('constants/wobjectsData');

const _ = require('lodash');

const getByGroupId = async ({
  groupId, skip, limit,
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
    },
    {
      search: 0,
    },
    {},
    skip,
    limit + 1,
  );

  if (wobjError) return { error: wobjError };
  return {
    wobjects: _.take(wobjects, limit),
    hasMore: wobjects.length > limit,
  };
};

module.exports = getByGroupId;
