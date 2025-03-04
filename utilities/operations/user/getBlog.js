const { Post, hiddenPostModel, mutedUserModel } = require('../../../models');
const _ = require('lodash');

module.exports = async ({
  name, limit, skip, userName, app, tagsArray,
}) => {
  const additionalCond = {};
  const { result: mutedUsers } = await mutedUserModel.find({
    condition: { $or: [{ userName: name, mutedForApps: _.get(app, 'host') }, { mutedBy: userName }] },
  });

  const muted = _.reduce(mutedUsers, (mute, user) => {
    name === user.userName
      ? mute.author.push(user)
      : mute.users.push(user);
    return mute;
  }, { author: [], users: [] });

  if (!_.isEmpty(muted.author)) return { posts: [], tags: [] };
  if (!_.isEmpty(muted.users)) Object.assign(additionalCond, { 'reblog_to.author': { $nin: _.map(muted.users, 'userName') } });

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

  return { posts: posts.slice(0, limit), hasMore: posts.length === limit + 1 };
};
