const { CampaignPayments } = require('../database').models;

exports.find = async ({ filter, projection = {}, options = {} }) => {
  try {
    return { result: await CampaignPayments.find(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};

exports.aggregate = async (pipeline) => {
  try {
    return { result: await CampaignPayments.aggregate(pipeline) };
  } catch (error) {
    return { error };
  }
};

exports.findOne = async ({ filter, projection = {}, options = {} }) => {
  try {
    return { result: await CampaignPayments.findOne(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};
