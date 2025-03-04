const { Campaign } = require('../database').models;

const findByCondition = async (condition) => {
  try {
    return { result: await Campaign.find(condition).lean() };
  } catch (error) {
    return { error };
  }
};

const aggregate = async (pipeline) => {
  try {
    return { result: await Campaign.aggregate(pipeline) };
  } catch (error) {
    return { error };
  }
};

const findOne = async (condition, select = {}) => {
  try {
    return { result: await Campaign.findOne(condition, select).lean() };
  } catch (error) {
    return { error };
  }
};

module.exports = { findByCondition, aggregate, findOne };
