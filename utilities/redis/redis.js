const redis = require('redis');
const config = require('config');

const wobjRefsClient = redis.createClient();
const importUserClient = redis.createClient();
const mainFeedsCacheClient = redis.createClient();
const tagCategoriesClient = redis.createClient();
const appUsersStatistics = redis.createClient();
const processedPostClient = redis.createClient();

const setupRedisConnections = async () => {
  await wobjRefsClient.connect();
  await importUserClient.connect();
  await mainFeedsCacheClient.connect();
  await tagCategoriesClient.connect();
  await appUsersStatistics.connect();
  await processedPostClient.connect();

  await wobjRefsClient.select(config.redis.wobjRefs);
  await importUserClient.select(config.redis.importUser);
  await mainFeedsCacheClient.select(config.redis.mainFeedsCache);
  await tagCategoriesClient.select(config.redis.tagCategories);
  await appUsersStatistics.select(config.redis.appDayUsers);
  await processedPostClient.select(config.redis.processedPost);
  console.log('Redis setup completed');
};

module.exports = {
  setupRedisConnections,
  wobjRefsClient,
  importUserClient,
  mainFeedsCacheClient,
  tagCategoriesClient,
  appUsersStatistics,
  processedPostClient,
};
