const { followersHelper } = require('../../helpers');
const { FOLLOWERS_SORT } = require('../../../constants/sortData');

module.exports = async ({
  // eslint-disable-next-line camelcase
  author_permlink, skip, limit, sort,
}) => {
  const result = await followersHelper.sortUsers({
    collection: FOLLOWERS_SORT.WOBJECT_SUB,
    field: FOLLOWERS_SORT.FOLLOWING,
    name: author_permlink,
    limit: limit + 1,
    skip,
    sort,
  });

  return {
    result: { wobjectFollowers: result.slice(0, limit), hasMore: result.length === limit + 1 },
  };
};
