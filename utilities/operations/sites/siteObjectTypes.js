const { OBJECT_TYPES } = require('@waivio/objects-processor');
const { getAppAuthorities } = require('../../helpers/appHelper');
const { Wobj } = require('../../../models');
const {
  getCachedData,
  setCachedData,
} = require('../../helpers/cacheHelper');
const jsonHelper = require('../../helpers/jsonHelper');
const { redisGetter, redis } = require('../../redis');
const {
  REDIS_KEYS,
  TTL_TIME,
} = require('../../../constants/common');

const TYPES_FOR_SITE = [
  OBJECT_TYPES.PRODUCT,
  OBJECT_TYPES.RESTAURANT,
  OBJECT_TYPES.RECIPE,
  OBJECT_TYPES.DISH,
  OBJECT_TYPES.DRINK,
  OBJECT_TYPES.BOOK,
  OBJECT_TYPES.BUSINESS,
];

const getObjectTypes = async (app) => {
  const authorities = getAppAuthorities(app);

  const { wobjects = [] } = await Wobj.fromAggregation([
    {
      $match: {
        object_type: { $in: TYPES_FOR_SITE },
        'authority.administrative': { $in: authorities },
      },
    },
    {
      $group: {
        _id: '$object_type',
      },
    },
    {
      $project: {
        _id: 0,
        object_type: '$_id',
      },
    },
  ]);

  const result = wobjects.map((r) => r.object_type);

  await setCachedData({
    key: `${REDIS_KEYS.CHALLENGES_OBJECT_TYPES}:${app.host}`,
    data: result,
    ttl: TTL_TIME.THIRTY_DAYS,
  });

  return result;
};

/**
 * here we have long request with data that can dynamically change
 * so we give data from cache and update cache in background
  */

const getSocialSiteObjectTypes = async ({ app }) => {
  if (!app) return [];
  const key = `${REDIS_KEYS.CHALLENGES_OBJECT_TYPES}:${app.host}`;
  const cache = await getCachedData(key);
  if (cache) {
    const { result: ttl } = await redisGetter.ttlAsync({
      key,
      client: redis.mainFeedsCacheClient,
    });

    const updateCache = TTL_TIME.THIRTY_DAYS - TTL_TIME.FIVE_MINUTES > ttl;
    if (updateCache) getObjectTypes(app);

    return jsonHelper.parseJson(cache, []);
  }

  return getObjectTypes(app);
};

module.exports = {
  getSocialSiteObjectTypes,
};
