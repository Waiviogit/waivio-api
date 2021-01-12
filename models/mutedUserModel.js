const { MutedUser } = require('database').models;

exports.findOne = async (condition) => {
  try {
    return { mutedUser: await MutedUser.findOne(condition).lean() };
  } catch (error) {
    return { error };
  }
};

exports.find = async ({ condition, select = {}, sort = {} }) => {
  try {
    return { result: await MutedUser.find(condition, select).sort(sort).lean() };
  } catch (error) {
    return { error };
  }
};
