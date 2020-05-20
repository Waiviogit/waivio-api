const { wobjRefsClient, importUserClient, mainFeedsCacheClient } = require('utilities/redis/redis');
const {
  HOT_NEWS_CACHE_PREFIX, HOT_NEWS_CACHE_SIZE, TREND_NEWS_CACHE_SIZE, TREND_NEWS_CACHE_PREFIX,
} = require('utilities/constants');

/**
 * Get assigned wobjects to post by post path("author" + "_" + "permlink")
 * @param path {String}
 * @returns {Promise<*>} Return array of wobjects(author_permlink with percent)
 */
exports.getWobjRefs = async (authorPermlink) => wobjRefsClient.hgetallAsync(authorPermlink);

/**
 * Get list of users which currently importing
 * @returns {Promise<*>} array of strings
 */
exports.getAllImportedUsers = async () => importUserClient.keysAsync('import_user:*');

/**
 * Get list of errored users
 * @returns {Promise<*>}
 */
exports.getAllErroredUsers = async () => importUserClient.keysAsync('import_user_error:*');

exports.getErroredUser = async (userName) => importUserClient.getAsync(`import_user_error:${userName}`);

exports.getImportedUser = async (userName) => importUserClient.getAsync(`import_user:${userName}`);

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
    ids: await mainFeedsCacheClient.lrangeAsync(`${appPrefix}${HOT_NEWS_CACHE_PREFIX}:${locale}`, 0, limit - 1),
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
  limit = 10, locale, app, // prefix = TREND_NEWS_CACHE_PREFIX,
}) => {
  if (!locale) locale = 'en-US';
  if (limit > TREND_NEWS_CACHE_SIZE) return { error: `skip param should be less than ${TREND_NEWS_CACHE_SIZE}` };
  const appPrefix = app ? `${app}:` : '';
  return {
    ids: await mainFeedsCacheClient.lrangeAsync(`${appPrefix}${TREND_NEWS_CACHE_PREFIX}:${locale}`, 0, limit - 1),
    // ids: await mainFeedsCacheClient.lrangeAsync(`${appPrefix}${prefix}:${locale}`, 0, limit - 1),
  };
};
