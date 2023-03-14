const {
  TREND_NEWS_CACHE_PREFIX, HOT_NEWS_CACHE_PREFIX, TREND_FILTERED_NEWS_CACHE_PREFIX,
} = require('constants/postsData');
const { WEBSITE_SUSPENDED_COUNT } = require('constants/sitesConstants');
const {
  importUserClient,
  mainFeedsCacheClient,
  tagCategoriesClient,
  appUsersStatistics,
  processedPostClient,
} = require('utilities/redis/redis');
const { TOP_WOBJ_USERS_KEY, FIELDS_NAMES } = require('constants/wobjectsData');
const { LANGUAGES } = require('constants/common');

exports.addTopWobjUsers = async (permlink, ids) => mainFeedsCacheClient.saddAsync(`${TOP_WOBJ_USERS_KEY}:${permlink}`, ...ids);

/**
 * Set active users to redis for collect statistics and invoicing
 */
exports.addSiteActiveUser = async (key, ip) => appUsersStatistics.saddAsync(key, ip);

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
 * @param key {String}
 * @param client {}
 */
exports.deleteKey = async ({ key, client = importUserClient }) => client.delAsync(key);

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

exports.addTagCategory = async ({ categoryName, tags }) => tagCategoriesClient.zaddAsync(`${FIELDS_NAMES.TAG_CATEGORY}:${categoryName}`, tags);
exports.incrementTag = async ({ categoryName, tag, objectType }) => tagCategoriesClient.zincrbyAsync(`${FIELDS_NAMES.TAG_CATEGORY}:${objectType}:${categoryName}`, 1, tag);
exports.incrementDepartmentTag = async ({ categoryName, tag, department }) => tagCategoriesClient.zincrbyAsync(`${FIELDS_NAMES.DEPARTMENTS}:${department}:${categoryName}`, 1, tag);

exports.incrementWebsitesSuspended = async ({ key, expire }) => {
  const counter = await appUsersStatistics.incrAsync(`${WEBSITE_SUSPENDED_COUNT}:${key}`);
  await appUsersStatistics.expireAsync(`${WEBSITE_SUSPENDED_COUNT}:${key}`, expire);
  return counter;
};

exports.importUserClientHMSet = async ({ key, data, expire }) => {
  await importUserClient.hmsetAsync(key, data);
  await importUserClient.expireAsync(key, expire);
};

exports.hmsetAsync = async ({ key, data, client = importUserClient }) => {
  try {
    return { result: await client.hmsetAsync(key, data) };
  } catch (error) {
    return { error };
  }
};

exports.zadd = async ({
  key, now, keyValue, client = processedPostClient,
}) => client.zaddAsync(key, now, keyValue);

exports.saddAsync = async ({ key, values, client }) => client.saddAsync(key, ...values);

exports.set = ({ key, value, client = mainFeedsCacheClient }) => client.setAsync(key, value);
exports.expire = ({ key, ttl, client = mainFeedsCacheClient }) => client.expireAsync(key, ttl);

exports.addToCache = async ({
  key, ttl = 60, data, client = mainFeedsCacheClient,
}) => {
  await this.set({ key, value: JSON.stringify(data), client });
  await this.expire({ key, ttl, client });
};
