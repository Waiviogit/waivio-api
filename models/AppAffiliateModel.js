const { AppAffiliate } = require('../database').models;

exports.find = async ({ filter, projection = {}, options = {} }) => {
  try {
    return { result: await AppAffiliate.find(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};

exports.updateOne = async ({ filter, update = {}, options = {} }) => {
  try {
    return { result: await AppAffiliate.updateOne(filter, update, options).lean() };
  } catch (error) {
    return { error };
  }
};

exports.deleteMany = async ({ filter, options = {} }) => {
  try {
    return { result: await AppAffiliate.deleteMany(filter, options).lean() };
  } catch (error) {
    return { error };
  }
};
