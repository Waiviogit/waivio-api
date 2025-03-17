const { followersHelper } = require('../../helpers');
const { FOLLOWERS_SORT } = require('../../../constants/sortData');

module.exports = async ({
  name, skip, limit, sort,
}) => {
  const result = await followersHelper.sortUsers({
    collection: FOLLOWERS_SORT.USER_SUB,
    field: FOLLOWERS_SORT.FOLLOWING,
    limit: limit + 1,
    name,
    skip,
    sort,
  });

  return { result: { followers: result.slice(0, limit), hasMore: result.length === limit + 1 } };
};
