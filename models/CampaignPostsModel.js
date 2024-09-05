const { CampaignPosts } = require('database').models;

const findOne = async ({ filter, projection = {}, options = {} }) => {
  try {
    return { result: await CampaignPosts.findOne(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};

const find = async ({ filter, projection = {}, options = {} }) => {
  try {
    return { result: await CampaignPosts.find(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};

const updateOne = async ({ filter, update = {}, options = {} }) => {
  try {
    return { result: await CampaignPosts.updateOne(filter, update, options) };
  } catch (error) {
    return { error };
  }
};

const findOneByPost = async (post) => {
  const { result } = await findOne({
    filter: {
      author: post.author,
      permlink: post.permlink,
    },
    projection: {
      author: 1, permlink: 1,
    },
  });

  return result;
};

module.exports = {
  updateOne,
  find,
  findOne,
  findOneByPost,
};
