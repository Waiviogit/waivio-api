const _ = require('lodash');
const { Wobj } = require('../../../models');
const {
  OBJECT_TYPES,
  FIELDS_NAMES,
  REMOVE_OBJ_STATUSES,
} = require('../../../constants/wobjectsData');

const getEscapedUrl = (url) => url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getHostFromUrl = (url) => {
  try {
    return new URL(url).host;
  } catch (error) {
    return '';
  }
};

const checkLinkSafety = async ({ url }) => {
  const host = getHostFromUrl(url);
  if (!host) return { error: { status: 422, message: 'Invalid url' } };

  const searchString = getEscapedUrl(host);
  const regex = new RegExp(`^(https:\\/\\/|http:\\/\\/|www\\.)${searchString}`);

  const pipeline = [
    {
      $match: {
        object_type: OBJECT_TYPES.LINK,
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
        $or: [
          {
            fields: {
              $elemMatch: {
                name: 'url',
                body: url,
              },
            },
          },
          {
            fields: {
              $elemMatch: {
                name: 'url',
                body: { $regex: regex },
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        urlField: {
          $filter: {
            input: '$fields',
            cond: { $eq: ['$$this.name', 'url'] },
          },
        },
      },
    },
    {
      $addFields: {
        urlLength: { $strLenCP: { $arrayElemAt: ['$urlField.body', 0] } },
        isExactMatch: {
          $eq: [{ $arrayElemAt: ['$urlField.body', 0] }, url],
        },
      },
    },
    {
      $sort: {
        isExactMatch: -1,
        urlLength: 1,
      },
    },
    {
      $limit: 1,
    },
    {
      $project: {
        author_permlink: 1,
        fields: 1,
      },
    },
  ];

  const { wobjects = [] } = await Wobj.fromAggregation(pipeline);
  const result = wobjects[0];

  const ratingField = _.find(
    result?.fields,
    (el) => el.name === FIELDS_NAMES.RATING && el.body === 'Safety',
  );

  const response = {
    linkWaivio: result?.author_permlink || '',
    rating: ratingField?.average_rating_weight || 0,
    fieldAuthor: ratingField?.author || '',
    fieldPermlink: ratingField?.permlink || '',
  };

  return { result: response };
};

module.exports = {
  checkLinkSafety,
};
