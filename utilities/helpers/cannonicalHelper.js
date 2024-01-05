const { App, Post } = require('models');
const {
  getCacheKey,
  getCachedData,
  setCachedData,
} = require('./cacheHelper');
const jsonHelper = require('./jsonHelper');
const { TTL_TIME } = require('../../constants/common');
const { STATUSES } = require('../../constants/sitesConstants');

const DEFAULT_CANONICAL = 'www.waivio.com';
const getWobjectCanonicalHost = async ({ owner }) => {
  const { result } = await App.findOneCanonicalByOwner({ owner });
  if (!result) return DEFAULT_CANONICAL;
  if (result.status !== STATUSES.ACTIVE) return DEFAULT_CANONICAL;
  if (['waiviodev.com', 'waivio.com'].includes(result.host)) return DEFAULT_CANONICAL;
  return result.host;
};

const getWobjectCanonical = async ({ owner, host, authorPermlink }) => {
  const key = getCacheKey({ getWobjectCanonical: { owner, host, authorPermlink } });
  const cache = await getCachedData(key);
  if (cache) return jsonHelper.parseJson(cache, DEFAULT_CANONICAL);

  const result = await getWobjectCanonicalHost({ owner });

  await setCachedData({
    key, data: result, ttl: TTL_TIME.ONE_DAY,
  });

  return result;
};

const getUserCanonical = async ({ name }) => {
  const { result } = await Post.findOneFirstByAuthor({ author: name });
  if (!result) {
    // can cache for one day
    return {
      post: false,
      canonical: DEFAULT_CANONICAL,
    };
  }

  const json = jsonHelper.parseJson(result?.json_metadata, {});

  let originalHost = json?.host;
  if (['waiviodev.com', 'waivio.com'].includes(result.host)) {
    originalHost = DEFAULT_CANONICAL;
  }

  return {
    post: true,
    canonical: originalHost || DEFAULT_CANONICAL,
  };
};

module.exports = {
  getWobjectCanonical,
  getUserCanonical,
};
