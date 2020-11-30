const _ = require('lodash');
const uuid = require('uuid/v4');
const { relatedAlbum } = require('models');
const { FIELDS_NAMES } = require('constants/wobjectsData');

module.exports = async (data) => {
  const pipeline = [
    { $match: { wobjAuthorPermlink: data.authorPermlink } },
    { $unwind: '$images' },
    { $skip: data.skip },
    { $limit: data.limit + 1 },
    { $project: { body: '$images', id: '$wobjAuthorPermlink', _id: 0 } },
  ];
  const countPipeline = [
    { $match: { wobjAuthorPermlink: data.authorPermlink } },
    { $unwind: '$images' },
    { $count: 'imagesCount' },
  ];
  const { result, error } = await relatedAlbum.aggregate(pipeline);
  const { result: [count], error: countError } = await relatedAlbum.aggregate(countPipeline);
  if (error || countError) return { error: error || countError };

  return {
    json: {
      body: 'Related',
      id: `${data.authorPermlink}-related`,
      count: _.get(count, 'imagesCount', 0),
      name: FIELDS_NAMES.GALLERY_ALBUM,
      items: _
        .chain(result)
        .slice(0, data.limit)
        .forEach((el) => {
          el.permlink = uuid();
          el.id = `${el.id}-related`;
        })
        .value(),
      hasMore: result.length === data.limit + 1,
    },
  };
};
