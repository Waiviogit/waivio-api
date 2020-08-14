const { followersHelper } = require('utilities/helpers');

module.exports = async ({
  name, skip, limit, sort,
}) => {
  const result = await followersHelper.sortUsers({
    field: 'following', name, limit: limit + 1, skip, sort,
  });

  return { result: { followers: result.slice(0, limit), hasMore: result.length === limit + 1 } };
};
