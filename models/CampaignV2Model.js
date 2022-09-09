const { CampaignV2 } = require('database').models;

exports.find = async ({ filter, projection = {}, options = {} }) => {
  try {
    return { result: await CampaignV2.find(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};

exports.aggregate = async (pipeline) => {
  try {
    return { result: await CampaignV2.aggregate(pipeline) };
  } catch (error) {
    return { error };
  }
};

exports.findOne = async ({ filter, projection = {}, options = {} }) => {
  try {
    return { result: await CampaignV2.findOne(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};
