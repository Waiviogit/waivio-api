const _ = require('lodash');
const { User, Post, hiddenPostModel } = require('models');

module.exports = async ({
  // eslint-disable-next-line camelcase
  name, limit, skip, userName,
}) => {
  const { user, error: userError } = await User.getOne(name);
  const { hiddenPosts = [] } = await hiddenPostModel.getHiddenPosts(userName);
  const additionalCond = _.isEmpty(hiddenPosts)
    ? {}
    : { _id: { $not: { $in: hiddenPosts } } };

  if (userError) return { error: userError };
  if (user && user.auth) {
    return Post.getBlog({
      name, limit, skip, additionalCond,
    });
  }
  const { posts, error } = await Post.getBlog(
    {
      limit, name, skip: skip !== 0 ? skip - 1 : 0, additionalCond,
    },
  );

  if (error) return { error };

  // add field reblogged_by if post not authored by "user" blog requested
  posts.forEach((post) => {
    if (post.author !== name) post.reblogged_by = [name];
  });
  return { posts };
};
