const { RelatedAlbum } = require('../database').models;

exports.aggregate = async (pipeline) => {
  try {
    const result = await RelatedAlbum.aggregate(pipeline);
    return { result };
  } catch (error) {
    return { error };
  }
};
