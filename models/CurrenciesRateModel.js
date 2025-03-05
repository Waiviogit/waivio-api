const { CurrenciesRate } = require('../currenciesDB').models;

exports.find = async (condition = {}) => {
  try {
    return { result: await CurrenciesRate.find(condition).lean() };
  } catch (error) {
    return { error };
  }
};

exports.findOne = async ({ condition, sort }) => {
  try {
    return {
      result: await CurrenciesRate.findOne(condition).sort(sort).lean(),
    };
  } catch (error) {
    return { error };
  }
};
