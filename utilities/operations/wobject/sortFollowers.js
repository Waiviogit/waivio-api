const { followersHelper } = require('utilities/helpers');

module.exports = async ({
  // eslint-disable-next-line camelcase
  author_permlink, skip, limit, sort,
}) => {
  const result = await followersHelper.sortUsers({
    field: 'following', name: author_permlink, limit: limit + 1, skip, sort, collection: 'wobjectSubscription',
  });
  return {
    result: { wobjectFollowers: result.slice(0, limit), hasMore: result.length === limit + 1 },
  };
};
