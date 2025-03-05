const { BotUpvote } = require('../database').models;

const find = async (condition = {}, select = {}) => {
  try {
    return { result: await BotUpvote.find(condition, select).lean() };
  } catch (error) {
    return { error };
  }
};

module.exports = { find };
