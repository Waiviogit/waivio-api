const _ = require('lodash');
const { RelatedAlbum } = require('database').models;

exports.aggregate = async (pipeline) => {
  try {
    const items = await RelatedAlbum.aggregate(pipeline);

    if (_.isEmpty(items)) {
      return { error: { status: 404, message: 'Images not found!' } };
    }
    return { items };
  } catch (error) {
    return { error };
  }
};
