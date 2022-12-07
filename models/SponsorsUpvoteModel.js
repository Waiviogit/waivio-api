const { SponsorsUpvote } = require('database').models;

exports.find = async ({ filter, projection = {}, options = {} }) => {
  try {
    return { result: await SponsorsUpvote.find(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};
