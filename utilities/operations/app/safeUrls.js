const redisGetter = require('../../redis/redisGetter');
const redisClient = require('../../redis/redis');
const { REDIS_KEYS } = require('../../../constants/common');
const jsonHelper = require('../../helpers/jsonHelper');

const getSafeUrlData = async () => {
  const { result } = await redisGetter.getAsync({
    client: redisClient.mainFeedsCacheClient,
    key: REDIS_KEYS.SAFE_SITE_PREFIX_DATA,
  });

  return jsonHelper.parseJson(result, {});
};

module.exports = {
  getSafeUrlData,
};
