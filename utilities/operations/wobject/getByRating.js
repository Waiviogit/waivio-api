const axios = require('axios');
const moment = require('moment/moment');
const _ = require('lodash');
const { Wobj } = require('../../../models');
const { redis, redisGetter, redisSetter } = require('../../redis');
const {
  OBJECT_TYPES, FIELDS_NAMES,
  REMOVE_OBJ_STATUSES,
} = require('../../../constants/wobjectsData');
const { REDIS_KEYS, TTL_TIME } = require('../../../constants/common');
const {
  getCachedData,
  setCachedData,
} = require('../../helpers/cacheHelper');
const jsonHelper = require('../../helpers/jsonHelper');

const DAYS_TO_UPDATE_SITES_SET = 10;

const getEscapedUrl = (url) => url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const diffInDays = (unixTimestamp) => moment().diff(moment.unix(unixTimestamp), 'days');

const getHostFromUrl = (url) => {
  try {
    return new URL(url).host;
  } catch (error) {
    return '';
  }
};

const updateSpaminatorList = async () => {
  try {
    const response = await axios.get('https://spaminator.me/api/p/domains.json');

    if (!response?.data?.result?.length) return;

    await redisSetter.saddAsync({
      key: REDIS_KEYS.FISHING_SITES_SET,
      client: redis.processedPostClient,
      values: response.data.result,
    });

    await redisSetter.set({
      key: REDIS_KEYS.FISHING_SITES_LAST_UPDATE,
      client: redis.processedPostClient,
      value: moment().unix(),
    });
  } catch (error) {

  }
};

const checkSpaminatorSites = async (url) => {
  const { host } = new URL(url);

  const { result: lastTimeUpdated } = await redisGetter.getAsync({
    key: REDIS_KEYS.FISHING_SITES_LAST_UPDATE,
    client: redis.processedPostClient,
  });

  if (diffInDays(lastTimeUpdated) > DAYS_TO_UPDATE_SITES_SET) {
    updateSpaminatorList();
  }

  const exists = await redisGetter.sismember({
    key: REDIS_KEYS.FISHING_SITES_SET,
    client: redis.processedPostClient,
    member: host,
  });

  return !!exists;
};

const checkLinkSafety = async ({ url }) => {
  const host = getHostFromUrl(url);
  if (!host) return { error: { status: 422, message: 'Invalid url' } };
  const searchString = getEscapedUrl(host);
  const regex = new RegExp(`^(https:\\/\\/|http:\\/\\/|www\\.)${searchString}`);

  const key = `${REDIS_KEYS.API_RES_CACHE}:safe_link:${host}`;
  const cache = await getCachedData(key);
  if (cache) return jsonHelper.parseJson(cache, null);

  const { result } = await Wobj.findOne({
    object_type: OBJECT_TYPES.LINK,
    fields: {
      $elemMatch: {
        name: 'url',
        body: { $regex: regex },
      },
    },
    'status.title': { $nin: REMOVE_OBJ_STATUSES },
  }, { author_permlink: 1, fields: 1 });

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

  if (ratingField?.average_rating_weight) {
    await setCachedData({
      key, data: { result: response }, ttl: TTL_TIME.THIRTY_DAYS,
    });
  }

  return { result: response };
};

module.exports = {
  checkLinkSafety,
};
