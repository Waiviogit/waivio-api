const { relatedAlbum } = require('models');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const _ = require('lodash');
const uuid = require('uuid/v4');

module.exports = async (data) => {
  const pipeline = [
    { $match: { wobjAuthorPermlink: data.authorPermlink } },
    { $unwind: '$images' },
    { $skip: data.skip },
    { $limit: data.limit + 1 },
    { $project: { body: '$images', id: '$wobjAuthorPermlink' } },
  ];

  const { result, error } = await relatedAlbum.aggregate(pipeline);
  const { count, error: countError } = await relatedAlbum
    .countDocuments({ wobjAuthorPermlink: data.authorPermlink });
  if (error || countError) return { error: error || countError };

  return {
    json: {
      body: 'Related',
      id: data.authorPermlink,
      count,
      name: FIELDS_NAMES.GALLERY_ALBUM,
      items: _
        .chain(result)
        .slice(0, data.limit)
        .forEach((el) => { el.permlink = uuid(); })
        .value(),
      hasMore: result.length === data.limit + 1,
    },
  };
};
