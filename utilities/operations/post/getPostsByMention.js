const _ = require('lodash');
const { hiddenPostModel, mutedUserModel, Post } = require('../../../models');

const getPostsByMention = async ({
  account, skip, limit, follower, app,
}) => {
  const { result: mutedUsers } = await mutedUserModel.find({
    condition: { $or: [{ userName: account, mutedForApps: _.get(app, 'host') }, { mutedBy: follower }] },
  });
  const { hiddenPosts = [] } = await hiddenPostModel.getHiddenPosts(follower);

  const mutedNames = mutedUsers.map((el) => el.userName);

  const { result } = await Post.getPostsByCondition({
    condition: {
      ...(mutedNames?.length
        ? { author: { $nin: [...mutedNames, account] } }
        : { author: { $ne: account } }),
      ...(hiddenPosts?.length && { _id: { $nin: hiddenPosts } }),
      mentions: account,
    },
    skip,
    limit: limit + 1,
  });
  if (!result?.length) return { posts: [], hasMore: false };

  return {
    posts: _.take(result, limit),
    hasMore: result.length > limit,
  };
};

module.exports = getPostsByMention;
