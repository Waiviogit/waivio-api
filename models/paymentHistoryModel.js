const { PaymentHistory } = require('database').models;

const findByCondition = async (condition) => {
  try {
    return { result: await PaymentHistory.find(condition).lean() };
  } catch (error) {
    return { error };
  }
};

module.exports = { findByCondition };
