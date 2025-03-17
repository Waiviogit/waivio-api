const { WithdrawFunds } = require('../database').models;

exports.create = async (data) => {
  const newWithdraw = new WithdrawFunds(data);
  try {
    return { withdraw: await newWithdraw.save() };
  } catch (error) {
    console.error(error.message);
    return { error };
  }
};

exports.findOne = async (condition) => {
  try {
    return { result: await WithdrawFunds.findOne(condition).lean() };
  } catch (error) {
    return { error };
  }
};

exports.updateOne = async (condition, updateData) => {
  try {
    return { result: await WithdrawFunds.findOneAndUpdate(condition, updateData).lean() };
  } catch (error) {
    return { error };
  }
};
