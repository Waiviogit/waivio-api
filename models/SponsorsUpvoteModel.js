const { SponsorsUpvote } = require('database').models;

const find = async ({ filter, projection = {}, options = {} }) => {
  try {
    return { result: await SponsorsUpvote.find(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};

const getBotsByPost = async (post) => {
  const { result } = await find({
    filter: {
      author: post.root_author,
      permlink: post.permlink,
    },
    projection: { botName: 1 },

  });

  return result;
};

module.exports = {
  find,
  getBotsByPost,
};
