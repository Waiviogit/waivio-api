const { relatedAlbum } = require('models');
const { FIELDS_NAMES } = require('constants/wobjectsData');

module.exports = async (data) => {
  const pipeline = [
    { $match: { wobjAuthorPermlink: data.authorPermlink } },
    { $unwind: '$images' },
    { $project: { body: '$images', _id: 1, id: '$wobjAuthorPermlink' } },
    { $skip: data.skip },
    { $limit: data.limit + 1 },
  ];
  const { items, error } = await relatedAlbum.aggregate(pipeline);
  if (error) return { error };

  return {
    json: {
      body: 'Related',
      id: data.authorPermlink,
      name: FIELDS_NAMES.GALLERY_ALBUM,
      items: items.slice(0, data.limit),
      hasMore: items.length === data.limit + 1,
    },
  };
};
