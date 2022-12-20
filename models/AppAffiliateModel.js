const { AppAffiliate } = require('database').models;

exports.find = async ({ filter, projection = {}, options = {} }) => {
  try {
    return { result: await AppAffiliate.find(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};
