const { CampaignPosts } = require('database').models;

exports.findOne = async ({ filter, projection = {}, options = {} }) => {
  try {
    return { result: await CampaignPosts.findOne(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};

exports.find = async ({ filter, projection = {}, options = {} }) => {
  try {
    return { result: await CampaignPosts.find(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};

exports.updateOne = async ({ filter, update = {}, options = {} }) => {
  try {
    return { result: await CampaignPosts.updateOne(filter, update, options) };
  } catch (error) {
    return { error };
  }
};
