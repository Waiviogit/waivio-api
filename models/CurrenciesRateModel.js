const { CurrenciesRate } = require('currenciesDB').models;

exports.find = async (condition = {}, select) => {
  try {
    return { result: await CurrenciesRate.find(condition, select).lean() };
  } catch (error) {
    return { error };
  }
};

exports.findOne = async ({ condition, select, sort }) => {
  try {
    return {
      result: await CurrenciesRate.findOne(condition, select).sort(sort).lean(),
    };
  } catch (error) {
    return { error };
  }
};
