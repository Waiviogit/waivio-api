const { WebsiteStatistic } = require('../database').models;

exports.aggregate = async (condition) => {
  try {
    return { result: await WebsiteStatistic.aggregate(condition) };
  } catch (error) {
    return { error };
  }
};
