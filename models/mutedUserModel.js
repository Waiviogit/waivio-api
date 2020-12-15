const { MutedUser } = require('database').models;

exports.findOne = async (condition) => {
  try {
    return { mutedUser: await MutedUser.findOne(condition).lean() };
  } catch (error) {
    return { error };
  }
};
