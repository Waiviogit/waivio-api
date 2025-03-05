const redisSetter = require('../../redis/redisSetter');
const redisGetter = require('../../redis/redisGetter');
const { mainFeedsCacheClient } = require('../../redis/redis');
const { TTL_TIME } = require('../../../constants/common');

const REDIS_KEY_PREVIEW = 'preview_tiktok:';
const getLinks = async ({ urls }) => {
  const links = [];

  for (const url of urls) {
    const key = `${REDIS_KEY_PREVIEW}${url}`;

    const { result } = await redisGetter.getAsync({
      key,
      client: mainFeedsCacheClient,
    });
    if (!result) continue;
    links.push({
      url,
      urlPreview: result,
    });
    await redisSetter.expire({
      key,
      ttl: TTL_TIME.ONE_DAY,
    });
  }

  return links;
};

const putLinks = async ({ url, urlPreview }) => {
  const key = `${REDIS_KEY_PREVIEW}${url}`;
  await redisSetter.set({
    key,
    value: urlPreview,
  });
  await redisSetter.expire({
    key,
    ttl: TTL_TIME.ONE_DAY,
  });
  return { result: 'ok' };
};

module.exports = {
  getLinks,
  putLinks,
};
