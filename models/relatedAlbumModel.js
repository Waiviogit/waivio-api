const { RelatedAlbum } = require('database').models;

exports.aggregate = async (pipeline) => {
  try {
    const result = await RelatedAlbum.aggregate(pipeline);
    return { result };
  } catch (error) {
    return { error };
  }
};

exports.countDocuments = async (condition) => {
  try {
    return { count: await RelatedAlbum.countDocuments(condition) };
  } catch (error) {
    return { error };
  }
};
