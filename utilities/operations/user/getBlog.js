const { User, Post } = require('models');
const { getTagsByUser } = require('utilities/helpers/postHelper');
const _ = require('lodash');

module.exports = async ({
  // eslint-disable-next-line camelcase
  name, limit, skip, tagsArray,
}) => {
  const { user, error: userError } = await User.getOne(name);
  const additionalCond = _.isEmpty(tagsArray)
    ? {}
    : { 'wobjects.author_permlink': { $in: tagsArray } };

  if (userError) return { error: userError };
  if (user && user.auth) {
    return Post.getBlog({
      name, limit, skip, additionalCond,
    });
  }
  const { posts, error } = await Post.getBlog({
    limit, name, skip: skip !== 0 ? skip - 1 : 0, additionalCond,
  });

  if (error) return { error };

  // add field reblogged_by if post not authored by "user" blog requested
  posts.forEach((post) => {
    if (post.author !== name) post.reblogged_by = [name];
  });

  const { tags } = await getTagsByUser({ author: name, skip });
  return { json: { tags, posts } };
};
