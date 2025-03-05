const { Department } = require('../database').models;

exports.find = async ({ filter, projection = {}, options = {} }) => {
  try {
    return { result: await Department.find(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};

exports.aggregate = async (pipeline) => {
  try {
    return { result: await Department.aggregate(pipeline) };
  } catch (error) {
    return { error };
  }
};
