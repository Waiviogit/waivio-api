const _ = require('lodash');
const { relatedAlbum } = require('models');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const wObjectHelper = require('utilities/helpers/wObjectHelper');
const {
  Wobj,
} = require('models');
const crypto = require('crypto');

const getRemoveFilter = (processedObj) => _.chain(processedObj.remove || [])
  .compact()
  .uniq()
  .map((el) => {
    const [author, permlink] = el.split('/');
    return `${author}_${permlink}`;
  })
  .value();

module.exports = async ({
  authorPermlink, skip, limit, locale, app,
}) => {
  const { wObject } = await Wobj.getOne(authorPermlink);
  const processedObj = await wObjectHelper.processWobjects({
    wobjects: [wObject],
    locale,
    fields: [FIELDS_NAMES.REMOVE],
    returnArray: false,
    app,
  });
  const removeFilter = getRemoveFilter(processedObj);

  const pipeline = [
    {
      $match: {
        wobjAuthorPermlink: authorPermlink,
        ...(!_.isEmpty(removeFilter) && { postAuthorPermlink: { $nin: removeFilter } }),
      },
    },
    { $unwind: '$images' },
    { $skip: skip },
    { $limit: limit + 1 },
    {
      $project: {
        body: '$images',
        id: '$wobjAuthorPermlink',
        postAuthorPermlink: '$postAuthorPermlink',
        _id: 0,
      },
    },
  ];
  const countPipeline = [
    {
      $match: {
        wobjAuthorPermlink: authorPermlink,
        ...(!_.isEmpty(removeFilter) && { postAuthorPermlink: { $nin: removeFilter } }),
      },
    },
    { $unwind: '$images' },
    { $count: 'imagesCount' },
  ];
  const { result, error } = await relatedAlbum.aggregate(pipeline);
  const { result: [count], error: countError } = await relatedAlbum.aggregate(countPipeline);
  if (error || countError) return { error: error || countError };

  return {
    json: {
      body: 'Related',
      id: `${authorPermlink}-related`,
      count: _.get(count, 'imagesCount', 0),
      name: FIELDS_NAMES.GALLERY_ALBUM,
      items: _
        .chain(result)
        .slice(0, limit)
        .forEach((el) => {
          const [creator] = el.postAuthorPermlink.split('_');
          el.permlink = crypto.randomUUID();
          el.id = `${el.id}-related`;
          el.creator = creator;
        })
        .value(),
      hasMore: result.length === limit + 1,
    },
  };
};
