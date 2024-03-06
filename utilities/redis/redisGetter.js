const {
  wobjRefsClient, importUserClient, mainFeedsCacheClient, tagCategoriesClient, appUsersStatistics, processedPostClient,
} = require('utilities/redis/redis');
const {
  HOT_NEWS_CACHE_PREFIX, HOT_NEWS_CACHE_SIZE, TREND_NEWS_CACHE_SIZE, TREND_NEWS_CACHE_PREFIX,
} = require('constants/postsData');
const { TOP_WOBJ_USERS_KEY } = require('constants/wobjectsData');
const jsonHelper = require('utilities/helpers/jsonHelper');

exports.removeTopWobjUsers = async (key) => mainFeedsCacheClient.DEL(`${TOP_WOBJ_USERS_KEY}:${key}`);
exports.getTopWobjUsers = async (key) => mainFeedsCacheClient.SMEMBERS(`${TOP_WOBJ_USERS_KEY}:${key}`);

/**
 * Get assigned wobjects to post by post path("author" + "_" + "permlink")
 * @param path {String}
 * @returns {Promise<*>} Return array of wobjects(author_permlink with percent)
 */
exports.getWobjRefs = async (authorPermlink) => wobjRefsClient.HGETALL(authorPermlink);

/**
 * Get list of users which currently importing
 * @returns {Promise<*>} array of strings
 */
exports.getAllImportedUsers = async () => importUserClient.KEYS('import_user:*');

/**
 * Get list of errored users
 * @returns {Promise<*>}
 */
exports.getAllErroredUsers = async () => importUserClient.KEYS('import_user_error:*');

exports.getErroredUser = async (userName) => importUserClient.GET(`import_user_error:${userName}`);

exports.getImportedUser = async (userName) => importUserClient.GET(`import_user:${userName}`);

/**
 * Get list of ids post to HOT feed from cache
 * @param limit {Number} count of ids to return
 * @param locale {String} specified locale from list of allowed languages
 * @param app {String} List ids by locales with moderation for specified App
 * @returns {Promise<{error: string}|{ids: *}>}
 */
exports.getHotFeedCache = async ({ limit = 10, locale, app }) => {
  if (!locale) locale = 'en-US';
  if (limit > HOT_NEWS_CACHE_SIZE) return { error: `skip param should be less than ${HOT_NEWS_CACHE_SIZE}` };
  const appPrefix = app ? `${app}:` : '';
  return {
    ids: await mainFeedsCacheClient.LRANGE(`${appPrefix}${HOT_NEWS_CACHE_PREFIX}:${locale}`, 0, -1),
  };
};

/**
 * Get list of ids post to TRENDING feed from cache
 * @param limit {Number} count of ids to return
 * @param locale {String} specified locale from list of allowed languages
 * @param app {String} List ids by locales with moderation for specified App
 * @param prefix
 * @returns {Promise<{error: string}|{ids: *}>}
 */
exports.getTrendFeedCache = async ({
  limit = 10, locale, app, prefix = TREND_NEWS_CACHE_PREFIX,
}) => {
  if (!locale) locale = 'en-US';
  if (limit > TREND_NEWS_CACHE_SIZE) return { error: `skip param should be less than ${TREND_NEWS_CACHE_SIZE}` };
  const appPrefix = app ? `${app}:` : '';
  return {
    ids: await mainFeedsCacheClient.LRANGE(`${appPrefix}${prefix}:${locale}`, 0, -1),
  };
};

exports.getTagCategories = async ({ key, start, end }) => {
  try {
    return { tags: await tagCategoriesClient.ZRANGE(key, start, end, 'REV') };
  } catch (error) {
    return { error };
  }
};

/**
 * Get active users from redis for collect statistics and invoicing
 */
exports.getSiteActiveUser = async (key) => appUsersStatistics.SMEMBERS(key);

exports.deleteSiteActiveUser = async (key) => appUsersStatistics.DEL(key);

exports.importUserClientHGetAll = async (key) => importUserClient.HGETALL(key);

exports.getHashAll = async ({ key, client = importUserClient }) => {
  try {
    return { result: await client.HGETALL(key) };
  } catch (error) {
    return { error };
  }
};

exports.getAsync = async ({ key, client = importUserClient }) => {
  try {
    return { result: await client.GET(key) };
  } catch (error) {
    return { error };
  }
};

exports.smembersAsync = async (key, client) => client.SMEMBERS(key);

exports.getFromCache = async ({ key, client = mainFeedsCacheClient }) => {
  const { result } = await this.getAsync({ key, client });
  if (!result) return;
  const parsedData = jsonHelper.parseJson(result, null);
  if (!parsedData) return;
  return parsedData;
};

exports.sismember = async ({
  key, member, client = processedPostClient,
}) => client.SISMEMBER(key, member);

exports.keys = ({ key, client = mainFeedsCacheClient }) => client.KEYS(key);

exports.zrangeWithScores = async ({
  key, start, end, client = importUserClient,
}) => client.ZRANGE_WITHSCORES(key, start, end);
