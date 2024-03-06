const { Threads } = require('database').models;

exports.find = async ({ filter, projection, options }) => {
  try {
    return { result: await Threads.find(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};

exports.aggregate = async ({ pipeline }) => {
  try {
    return { result: await Threads.aggregate(pipeline) };
  } catch (error) {
    return { error };
  }
};
