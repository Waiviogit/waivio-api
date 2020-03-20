const { importUserClient, mainFeedsCacheClient } = require('./redis');
const { LANGUAGES, TREND_NEWS_CACHE_PREFIX, HOT_NEWS_CACHE_PREFIX } = require('../constants');

/**
 * Add user name to namespace of currently importing users
 * @param userName {String}
 * @returns {Promise<void>}
 */
exports.addImportedUser = async (userName) => importUserClient.setAsync(`import_user:${userName}`, new Date().toISOString());

/**
 * Add user name to namespace of currently importing users
 * @param userName {String}
 * @param errorMessage {String}
 * @returns {Promise<void>}
 */
exports.setImportedUserError = async (userName, errorMessage) => importUserClient.setAsync(`import_user_error:${userName}`, errorMessage);

/**
 * Delete user name from list currently imported users
 * @param userName {String}
 */
exports.deleteImportedUser = (userName) => importUserClient.del(`import_user:${userName}`);

/**
 * Update list of TRENDING feed cache for specified locale
 * @param ids {[String]} list of posts "_id"
 * @param locale {String} locale of feed
 * @returns {Promise<void>}
 */
exports.updateTrendLocaleFeedCache = async ({ ids, locale }) => {
  if (!validateUpdateNewsCache(ids, locale)) return;
  await clearFeedLocaleCache(TREND_NEWS_CACHE_PREFIX);
  return mainFeedsCacheClient.rpushAsync([`${TREND_NEWS_CACHE_PREFIX}:${locale}`, ...ids]);
};

/**
 * Update list of HOT news cache for specified locale
 * @param ids {[String]} list of posts "_id"
 * @param locale {String} locale of feed
 * @returns {Promise<void>}
 */
exports.updateHotLocaleFeedCache = async ({ ids, locale }) => {
  if (!validateUpdateNewsCache(ids, locale)) return;
  await clearFeedLocaleCache(HOT_NEWS_CACHE_PREFIX);
  return mainFeedsCacheClient.rpushAsync([`${HOT_NEWS_CACHE_PREFIX}:${locale}`, ...ids]);
};

/**
 * Delete caches for feed by prefix for all locales
 * @param prefix {String} Namespace of feed cache
 * @returns {Promise<*>}
 */
async function clearFeedLocaleCache(prefix) {
  const keys = LANGUAGES.map((lang) => `${prefix}:${lang}`);
  return mainFeedsCacheClient.del(...keys);
}

function validateUpdateNewsCache(ids, locale) {
  if (!ids || !locale) {
    console.error('List of ids and locale must be specified');
    return false;
  }
  if (!Array.isArray(ids)) {
    console.error('Ids must be an array');
    return false;
  }
  if (!LANGUAGES.includes(locale)) {
    console.error('Locale must be from allowed list of languages');
    return false;
  }
  return true;
}
