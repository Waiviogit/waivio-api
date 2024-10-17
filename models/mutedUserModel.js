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

exports.findMutedBy = async ({ userName }) => {
  if (!userName) return [];
  const { result } = await this.find({ condition: { mutedBy: userName } });
  return result.map((el) => el.userName);
};
