const redis = require('ioredis');
const config = require('../../config');

const wobjRefsClient = redis.createClient();
const importUserClient = redis.createClient();
const mainFeedsCacheClient = redis.createClient();
const tagCategoriesClient = redis.createClient();
const appUsersStatistics = redis.createClient();
const processedPostClient = redis.createClient();

wobjRefsClient.select(config.redis.wobjRefs);
importUserClient.select(config.redis.importUser);
mainFeedsCacheClient.select(config.redis.mainFeedsCache);
tagCategoriesClient.select(config.redis.tagCategories);
appUsersStatistics.select(config.redis.appDayUsers);
processedPostClient.select(config.redis.processedPost);

module.exports = {
  wobjRefsClient,
  importUserClient,
  mainFeedsCacheClient,
  tagCategoriesClient,
  appUsersStatistics,
  processedPostClient,
};
