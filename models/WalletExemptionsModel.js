const { WalletExemptions } = require('../database').models;

exports.find = async (condition, select = {}) => {
  try {
    return {
      result: await WalletExemptions.find(condition, select).lean(),
    };
  } catch (error) {
    return { error };
  }
};
