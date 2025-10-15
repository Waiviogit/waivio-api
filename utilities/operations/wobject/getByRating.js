const _ = require('lodash');
const { Wobj } = require('../../../models');
const {
  OBJECT_TYPES,
  FIELDS_NAMES,
  REMOVE_OBJ_STATUSES,
} = require('../../../constants/wobjectsData');
const { sitesHelper } = require('../../helpers');

const makeUrls = (url) => {
  if (url.endsWith('*')) url = url.replace(/\*$/, '');
  const urls = [];
  urls.push(url);

  url = url.replace(/\/+$/, ''); // remove trailing slashes

  const parts = url.split('/');
  const base = `${parts[0]}//${parts[2]}`;
  let current = base;

  urls.push(base, `${base}/`);

  for (let i = 3; i < parts.length; i++) {
    current += `/${parts[i]}`;
    urls.push(current, `${current}/`);
  }

  return urls;
};

const findMostAppropriateObject = (objects, targetUrl) => {
  const normalize = (url) => url.replace(/\/+$/, '');

  const url = normalize(targetUrl);

  for (const obj of objects) {
    if (normalize(obj.url) === normalize(targetUrl)) return obj;
  }

  // Iteratively remove path segments and check
  const parts = url.split('/');
  while (parts.length > 3) { // keep protocol and domain
    parts.pop();
    const candidate = parts.join('/');
    for (const obj of objects) if (normalize(obj.url) === candidate) return obj;
  }

  return null;
};

const checkLinkSafety = async ({ url }) => {
  const urls = makeUrls(url);

  const { result: activeSites = [] } = await sitesHelper.getAllActiveSites();

  for (const activeSite of activeSites) {
    if (url.includes(activeSite.host)) {
      return {
        result: {
          linkWaivio: '',
          rating: 10,
          fieldAuthor: '',
          fieldPermlink: '',
        },
      };
    }
  }

  const { result: objects } = await Wobj.find({
    object_type: OBJECT_TYPES.LINK,
    'status.title': { $nin: REMOVE_OBJ_STATUSES },
    fields: {
      $elemMatch: {
        name: 'url',
        body: { $in: urls },
      },
    },
  }, {
    fields: 1,
    author_permlink: 1,
  });

  const mapped = objects.map((el) => ({
    ...el,
    url: el.fields.find((f) => f.name === FIELDS_NAMES.URL)?.body,
  }));

  const result = findMostAppropriateObject(mapped, url);

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
