const { Post, hiddenPostModel, mutedUserModel } = require('models');
const { getTagsByUser } = require('utilities/helpers/postHelper');
const _ = require('lodash');

module.exports = async ({
  name, limit, skip, userName, app, tagsArray,
}) => {
  const additionalCond = {};
  const { result: mutedAuthor } = await mutedUserModel.find({
    condition: { $or: [{ userName: name, mutedForApps: _.get(app, 'host') }, { userName: name, mutedBy: userName }] },
  });
  if (!_.isEmpty(mutedAuthor)) return { posts: [], tags: [] };

  const { result: mutedUsers } = await mutedUserModel.find({ condition: { mutedBy: userName } });
  if (!_.isEmpty(mutedUsers)) Object.assign(additionalCond, { 'reblog_to.author': { $nin: _.map(mutedUsers, 'userName') } });

  const { hiddenPosts = [] } = await hiddenPostModel.getHiddenPosts(userName);
  if (!_.isEmpty(hiddenPosts)) Object.assign(additionalCond, { _id: { $nin: hiddenPosts } });

  if (!_.isEmpty(tagsArray)) Object.assign(additionalCond, { 'wobjects.author_permlink': { $in: tagsArray } });

  const { posts, error: postError } = await Post.getBlog({
    limit: limit + 1, name, skip, additionalCond,
  });

  if (postError) return { error: postError };

  // add field reblogged_by if post not authored by "user" blog requested
  posts.forEach((post) => {
    if (post.author !== name) post.reblogged_by = [name];
  });
  const { tags } = await getTagsByUser({ author: name });

  return { tags, posts: posts.slice(0, limit), hasMore: posts.length === limit + 1 };
};
