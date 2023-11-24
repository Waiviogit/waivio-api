const { App } = require('models');
const {
  getCacheKey,
  getCachedData,
  setCachedData,
} = require('./cacheHelper');
const jsonHelper = require('./jsonHelper');
const { TTL_TIME } = require('../../constants/common');

const getWobjectCanonicalHost = async ({ owner }) => {
  const { result, error } = await App.findOldestActiveHostByOwner({ owner });
  if (error || !result) return DEFAULT_CANONICAL;
  if (['waiviodev.com', 'waivio.com'].includes(result.host)) return DEFAULT_CANONICAL;
  return result.host;
};

const DEFAULT_CANONICAL = 'www.waivio.com';
const getWobjectCanonical = async ({ owner }) => {
  const key = getCacheKey({ getWobjectCanonical: owner });
  const cache = await getCachedData(key);
  if (cache) return jsonHelper.parseJson(cache, DEFAULT_CANONICAL);

  const result = await getWobjectCanonicalHost({ owner });

  await setCachedData({
    key, data: result, ttl: TTL_TIME.ONE_DAY,
  });

  return result;
};

module.exports = {
  getWobjectCanonical,
};
