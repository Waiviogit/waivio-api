const { User, Post } = require('models');
const { postHelper } = require('utilities/helpers');

module.exports = async ({
  // eslint-disable-next-line camelcase
  name, limit, skip, start_author, start_permlink,
}) => {
  const { user, error: userError } = await User.getOne(name);

  if (userError) return { error: userError };
  if (user && user.auth) {
    return getGuestBlog({ name, limit, skip });
  }

  const { posts, error } = await getHiveBlog({
    name, limit, start_author, start_permlink,
  });
  if (error) return { error };

  // add field reblogged_by if post not authored by "user" blog requested
  posts.each((post) => {
    if (post.author !== name) post.reblogged_by = [name];
  });
  return { posts };
};

const getHiveBlog = async ({
  // eslint-disable-next-line camelcase
  name, limit, start_author, start_permlink,
}) => postHelper.getPostsByCategory(({
  category: 'blog', tag: name, limit, start_author, start_permlink,
}));

const getGuestBlog = async ({ name, skip, limit }) => Post.getBlog({ name, skip, limit });
