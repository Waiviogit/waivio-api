const { PaymentHistory } = require('../database').models;

const findByCondition = async (condition) => {
  try {
    return { result: await PaymentHistory.find(condition).lean() };
  } catch (error) {
    return { error };
  }
};
const aggregate = async (pipeline) => {
  try {
    return { result: await PaymentHistory.aggregate(pipeline) };
  } catch (error) {
    return { error };
  }
};

const addPaymentHistory = async (data) => {
  try {
    const payment = await PaymentHistory.create(data);
    return { result: payment };
  } catch (error) {
    return { result: false, error };
  }
};

module.exports = { findByCondition, aggregate, addPaymentHistory };
