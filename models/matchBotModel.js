const { MatchBot } = require('database').models;

exports.find = async (condition = {}, select = {}) => {
  try {
    return { bots: await MatchBot.find(condition, select).lean() };
  } catch (error) {
    return { error };
  }
};
