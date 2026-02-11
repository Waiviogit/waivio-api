const { SpamUser } = require('../database').models;

const findOne = async (condition, select = {}) => {
  try {
    return { result: await SpamUser.findOne(condition, select).lean() };
  } catch (error) {
    return { error };
  }
};

const isRestricted = async (user) => {
  const result = await SpamUser.findOne({ user, isSpam: true }, { _id: 1 }).lean();
  return Boolean(result);
};

module.exports = {
  findOne,
  isRestricted,
};
