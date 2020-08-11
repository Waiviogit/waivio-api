const { followersHelper } = require('utilities/helpers');

module.exports = async ({
  name, skip, limit, sort,
}) => {
  const result = await followersHelper.sortUsers({
    field: 'following', name, limit: limit + 1, skip, sort,
  });
  const hasMore = result.length === limit + 1;
  result.pop();

  return { result: { followers: result, hasMore } };
};
