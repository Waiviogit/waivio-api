const { CampaignPosts } = require('database').models;

exports.findOne = async ({ filter, projection = {}, options = {} }) => {
  try {
    return { result: await CampaignPosts.findOne(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};
