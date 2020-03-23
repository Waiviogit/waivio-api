const redis = require('redis');
const bluebird = require('bluebird');
const config = require('config');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const wobjRefsClient = redis.createClient(process.env.REDISCLOUD_URL);
const importUserClient = redis.createClient(process.env.REDISCLOUD_URL);
const mainFeedsCacheClient = redis.createClient(process.env.REDISCLOUD_URL);

wobjRefsClient.select(config.redis.wobjRefs);
importUserClient.select(config.redis.importUser);
mainFeedsCacheClient.select(config.redis.mainFeedsCache);


module.exports = { wobjRefsClient, importUserClient, mainFeedsCacheClient };
