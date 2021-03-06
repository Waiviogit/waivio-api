const redis = require('redis');
const bluebird = require('bluebird');
const config = require('config');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const wobjRefsClient = redis.createClient(process.env.REDISCLOUD_URL);
const importUserClient = redis.createClient(process.env.REDISCLOUD_URL);
const mainFeedsCacheClient = redis.createClient(process.env.REDISCLOUD_URL);
const tagCategoriesClient = redis.createClient(process.env.REDISCLOUD_URL);
const appUsersStatistics = redis.createClient(process.env.REDISCLOUD_URL);

wobjRefsClient.select(config.redis.wobjRefs);
importUserClient.select(config.redis.importUser);
mainFeedsCacheClient.select(config.redis.mainFeedsCache);
tagCategoriesClient.select(config.redis.tagCategories);
appUsersStatistics.select(config.redis.appDayUsers);

module.exports = {
  wobjRefsClient,
  importUserClient,
  mainFeedsCacheClient,
  tagCategoriesClient,
  appUsersStatistics,
};
