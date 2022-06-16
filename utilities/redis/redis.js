const redis = require('redis');
const config = require('config');

const wobjRefsClient = redis
  .createClient({ database: config.redis.wobjRefs });
const importUserClient = redis
  .createClient({ database: config.redis.importUser });
const mainFeedsCacheClient = redis
  .createClient({ database: config.redis.mainFeedsCache });
const tagCategoriesClient = redis
  .createClient({ database: config.redis.tagCategories });
const appUsersStatistics = redis
  .createClient({ database: config.redis.appDayUsers });
const processedPostClient = redis
  .createClient({ database: config.redis.processedPost });

(async () => {
  // await importUserClient.connect();
  // await wobjRefsClient.connect();
  // await mainFeedsCacheClient.connect();
  await tagCategoriesClient.connect();
  // await appUsersStatistics.connect();
  // await processedPostClient.connect();
})();

module.exports = {
  wobjRefsClient,
  importUserClient,
  mainFeedsCacheClient,
  tagCategoriesClient,
  appUsersStatistics,
  processedPostClient,
};
