const { EngineDepositWithdraw } = require('database').models;

exports.create = async (record) => {
  try {
    const newRecord = new EngineDepositWithdraw(record);
    await newRecord.save();
    return { result: true };
  } catch (error) {
    return { error };
  }
};
