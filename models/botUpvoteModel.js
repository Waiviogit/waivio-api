const { BotUpvote } = require('database').models;

const findOne = async (condition, select = {}) => {
  try {
    return { result: await BotUpvote.findOne(condition, select).lean() };
  } catch (error) {
    return { error };
  }
};

module.exports = { findOne };
