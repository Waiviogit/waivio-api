const { User, Post } = require('models');

module.exports = async ({
  name, tagsArray, limit, skip,
}) => {
  const { user, error: userError } = await User.getOne(name);

  if (userError) return { error: userError };
  if (user && user.auth) {
    return Post.getBlog({
      author: name,
      limit,
      skip,
      tagsCondition: {
        'wobjects.authorPermlink': { $in: tagsArray },
      },
    });
  }
  const { result, error } = await Post.getBlog({
    author: name,
    limit,
    skip: skip !== 0 ? skip - 1 : 0,
    tagsCondition: {
      'wobjects.authorPermlink': { $in: tagsArray },
    },
  });

  if (error) return { error };

  // add field reblogged_by if post not authored by "user" blog requested
  result.forEach((post) => {
    if (post.author !== name) post.reblogged_by = [name];
  });

  return { result };
};
