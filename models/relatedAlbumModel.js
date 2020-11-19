const { RelatedAlbum } = require('database').models;

exports.find = async ({
  condition, select, skip, limit,
}) => {
  try {
    return { items: await RelatedAlbum.find(condition, select).skip(skip).limit(limit).lean() };
  } catch (error) {
    return { error };
  }
};
