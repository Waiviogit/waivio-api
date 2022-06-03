const redis = require('redis');
const config = require('config');

const wobjRefsClient = redis.createClient();
const importUserClient = redis.createClient();
const mainFeedsCacheClient = redis.createClient();
const tagCategoriesClient = redis.createClient();
const appUsersStatistics = redis.createClient();
const processedPostClient = redis.createClient();

(async () => {
  try {
    await wobjRefsClient.connect();
    await importUserClient.connect();
    await mainFeedsCacheClient.connect();
    await tagCategoriesClient.connect();
    await appUsersStatistics.connect();
    await processedPostClient.connect();

    wobjRefsClient.select(config.redis.wobjRefs);
    importUserClient.select(config.redis.importUser);
    mainFeedsCacheClient.select(config.redis.mainFeedsCache);
    tagCategoriesClient.select(config.redis.tagCategories);
    appUsersStatistics.select(config.redis.appDayUsers);
    processedPostClient.select(config.redis.processedPost);
  } catch (error) {
    console.log(error.message);
  }
})();

module.exports = {
  wobjRefsClient,
  importUserClient,
  mainFeedsCacheClient,
  tagCategoriesClient,
  appUsersStatistics,
  processedPostClient,
};
