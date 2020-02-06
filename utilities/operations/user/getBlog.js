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
  return getSteemBlog({
    name, limit, start_author, start_permlink,
  });
};

const getSteemBlog = async ({
  // eslint-disable-next-line camelcase
  name, limit, start_author, start_permlink,
}) => postHelper.getPostsByCategory(({
  category: 'blog', tag: name, limit, start_author, start_permlink,
}));
const getGuestBlog = async ({ name, skip, limit }) => Post.getBlog({ name, skip, limit });
