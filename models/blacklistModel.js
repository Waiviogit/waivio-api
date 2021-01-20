const { Blacklist } = require('database').models;

exports.find = async (condition, select = {}) => {
  try {
    return { blackLists: await Blacklist.find(condition, select).lean() };
  } catch (error) {
    return { error };
  }
};
