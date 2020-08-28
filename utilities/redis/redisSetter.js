const { TOP_WOBJ_USERS_KEY } = require('constants/wobjectsData');
const { importUserClient, mainFeedsCacheClient, tagCategoriesClient } = require('./redis');
const {
  LANGUAGES, TREND_NEWS_CACHE_PREFIX, HOT_NEWS_CACHE_PREFIX, TREND_FILTERED_NEWS_CACHE_PREFIX,
} = require('../constants');

exports.addTopWobjUsers = async (permlink, ids) => mainFeedsCacheClient.saddAsync(`${TOP_WOBJ_USERS_KEY}:${permlink}`, ...ids);

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
 * @param app {String} list of ids for specified app
 * @returns {Promise<void>}
 */
exports.updateTrendLocaleFeedCache = async ({ ids, locale, app }) => {
  if (!validateUpdateNewsCache(ids, locale)) return;
  await clearFeedLocaleCache({ prefix: TREND_NEWS_CACHE_PREFIX, app, locale });
  const appPrefix = app ? `${app}:` : '';
  return mainFeedsCacheClient.rpushAsync([`${appPrefix}${TREND_NEWS_CACHE_PREFIX}:${locale}`, ...ids]);
};

exports.updateFilteredTrendLocaleFeedCache = async ({ ids, locale, app }) => {
  if (!validateUpdateNewsCache(ids, locale) || !ids.length) return;
  await clearFeedLocaleCache({ prefix: TREND_FILTERED_NEWS_CACHE_PREFIX, app, locale });
  const appPrefix = app ? `${app}:` : '';
  return mainFeedsCacheClient.rpushAsync([`${appPrefix}${TREND_FILTERED_NEWS_CACHE_PREFIX}:${locale}`, ...ids]);
};

/**
 * Update list of HOT news cache for specified locale
 * @param ids {[String]} list of posts "_id"
 * @param locale {String} locale of feed
 * @param app {String} list of ids for specified app
 * @returns {Promise<void>}
 */
exports.updateHotLocaleFeedCache = async ({ ids, locale, app }) => {
  if (!validateUpdateNewsCache(ids, locale)) return;
  await clearFeedLocaleCache({ prefix: HOT_NEWS_CACHE_PREFIX, app, locale });
  const appPrefix = app ? `${app}:` : '';
  return mainFeedsCacheClient.rpushAsync([`${appPrefix}${HOT_NEWS_CACHE_PREFIX}:${locale}`, ...ids]);
};

/**
 * Delete caches for feed by prefix for specified locale and app.
 * "prefix" is required, others optional. If locales not specified - delete cache for all locales.
 * @param app {String} Name of app, also namespace in redis(optional);
 * @param prefix {String} Namespace of feed cache(hot ,trending, etc.), required!
 * @param locale {String} Specified locale to clear cache only, if empty - clear all locales
 * @returns {Promise<*>}
 */
async function clearFeedLocaleCache({ app, prefix, locale }) {
  let keyTemplate = '';
  let keys = [];

  if (app) keyTemplate = `${app}`;
  keyTemplate += app ? `:${prefix}` : `${prefix}`;

  if (locale) keys.push(`${keyTemplate}:${locale}`);
  else {
    keys = LANGUAGES.map((lang) => `${keyTemplate}:${lang}`);
  }
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

exports.addTagCategory = async ({ categoryName, tags }) => tagCategoriesClient.zaddAsync(`tagCategory:${categoryName}`, tags);
