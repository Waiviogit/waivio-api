const { User, Post } = require('models');
const { postHelper } = require('utilities/helpers');

module.exports = async ({
  // eslint-disable-next-line camelcase
  name, limit, skip,
}) => {
  const { user, error: userError } = await User.getOne(name);

  if (userError) return { error: userError };
  if (user && user.auth) {
    return getGuestBlog({ name, limit, skip });
  }
  const { posts, error } = await postHelper.getPostsByCategory(
    { limit, name, skip: skip !== 0 ? skip - 1 : 0 },
  );

  if (error) return { error };

  // add field reblogged_by if post not authored by "user" blog requested
  posts.forEach((post) => {
    if (post.author !== name) post.reblogged_by = [name];
  });
  return { posts };
};

const getGuestBlog = async ({ name, skip, limit }) => Post.getBlog({ name, skip, limit });
