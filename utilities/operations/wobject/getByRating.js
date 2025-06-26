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
  const fullUrl = getEscapedUrl(url);

  const regex = new RegExp(`^(https:\\/\\/|http:\\/\\/|www\\.)${searchString}`);
  const regexFull = new RegExp(`^${fullUrl}`);

  const [{ result: execMatch }, { result: hostMatch }] = await Promise.all([
    Wobj.findOne({
      object_type: OBJECT_TYPES.LINK,
      fields: {
        $elemMatch: {
          name: 'url',
          body: { $regex: regexFull },
        },
      },
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
    }, { author_permlink: 1, fields: 1 }),
    Wobj.findOne({
      object_type: OBJECT_TYPES.LINK,
      fields: {
        $elemMatch: {
          name: 'url',
          body: { $regex: regex },
        },
      },
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
    }, { author_permlink: 1, fields: 1 }),
  ]);

  const result = execMatch || hostMatch;

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
