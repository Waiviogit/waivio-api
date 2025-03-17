const { WebsiteRefunds } = require('../database').models;

exports.find = async (condition) => {
  try {
    return { result: await WebsiteRefunds.find(condition).lean() };
  } catch (error) {
    return { error };
  }
};

exports.findOne = async (condition) => {
  try {
    return { result: await WebsiteRefunds.findOne(condition).lean() };
  } catch (error) {
    return { error };
  }
};

exports.deleteOne = async (condition) => {
  try {
    return { result: await WebsiteRefunds.deleteOne(condition).lean() };
  } catch (error) {
    return { error };
  }
};
