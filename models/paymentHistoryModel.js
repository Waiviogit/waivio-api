const { paymentHistory } = require('database').models;

const findByCondition = async (condition) => {
  try {
    return { result: await paymentHistory.find(condition).lean() };
  } catch (error) {
    return { error };
  }
};

module.exports = { findByCondition };
