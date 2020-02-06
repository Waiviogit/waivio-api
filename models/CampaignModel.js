const { Campaign } = require('database').models;

const findByCondition = async (condition) => {
  try {
    return { result: await Campaign.find(condition).lean() };
  } catch (error) {
    return { error };
  }
};

module.exports = { findByCondition };
