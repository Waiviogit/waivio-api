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

exports.addTopWobjUsers = async (permlink, ids) => mainFeedsCacheClient.SADD(`${TOP_WOBJ_USERS_KEY}:${permlink}`, ...ids);

/**
 * Set active users to redis for collect statistics and invoicing
 */
exports.addSiteActiveUser = async (key, ip) => appUsersStatistics.SADD(key, ip);

/**
 * Add user name to namespace of currently importing users
 * @param userName {String}
 * @returns {Promise<void>}
 */
exports.addImportedUser = async (userName) => importUserClient.SET(`import_user:${userName}`, new Date().toISOString());

/**
 * Add user name to namespace of currently importing users
 * @param userName {String}
 * @param errorMessage {String}
 * @returns {Promise<void>}
 */
exports.setImportedUserError = async (userName, errorMessage) => importUserClient.SET(`import_user_error:${userName}`, errorMessage);

/**
 * @param key {String}
 * @param client {}
 */
exports.deleteKey = async ({ key, client = importUserClient }) => client.DEL(key);

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
  return mainFeedsCacheClient.RPUSH([`${appPrefix}${TREND_NEWS_CACHE_PREFIX}:${locale}`, ...ids]);
};

exports.updateFilteredTrendLocaleFeedCache = async ({ ids, locale, app }) => {
  if (!validateUpdateNewsCache(ids, locale) || !ids.length) return;
  await clearFeedLocaleCache({ prefix: TREND_FILTERED_NEWS_CACHE_PREFIX, app, locale });
  const appPrefix = app ? `${app}:` : '';
  return mainFeedsCacheClient.RPUSH([`${appPrefix}${TREND_FILTERED_NEWS_CACHE_PREFIX}:${locale}`, ...ids]);
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
  return mainFeedsCacheClient.RPUSH([`${appPrefix}${HOT_NEWS_CACHE_PREFIX}:${locale}`, ...ids]);
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
  return mainFeedsCacheClient.DEL(...keys);
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

exports.addTagCategory = async ({ categoryName, tags }) => tagCategoriesClient.ZADD(`${FIELDS_NAMES.TAG_CATEGORY}:${categoryName}`, tags);
exports.incrementTag = async ({ categoryName, tag, objectType }) => tagCategoriesClient.ZINCRBY(`${FIELDS_NAMES.TAG_CATEGORY}:${objectType}:${categoryName}`, 1, tag);
exports.incrementDepartmentTag = async ({ categoryName, tag, department }) => tagCategoriesClient.ZINCRBY(`${FIELDS_NAMES.DEPARTMENTS}:${department}:${categoryName}`, 1, tag);

exports.incrementWebsitesSuspended = async ({ key, expire }) => {
  const counter = await appUsersStatistics.INCR(`${WEBSITE_SUSPENDED_COUNT}:${key}`);
  await appUsersStatistics.EXPIRE(`${WEBSITE_SUSPENDED_COUNT}:${key}`, expire);
  return counter;
};

exports.importUserClientHMSet = async ({ key, data, expire }) => {
  await importUserClient.HSET(key, data);
  await importUserClient.EXPIRE(key, expire);
};

exports.hmsetAsync = async ({ key, data, client = importUserClient }) => {
  try {
    return { result: await client.HSET(key, data) };
  } catch (error) {
    return { error };
  }
};

exports.zadd = async ({
  key, now, keyValue, client = processedPostClient,
}) => client.ZADD(key, {
  score: now, value: keyValue,
});

exports.saddAsync = async ({ key, values, client }) => client.sadd(key, ...values);

exports.set = ({ key, value, client = mainFeedsCacheClient }) => client.SET(key, value);

exports.setEx = ({
  key, ttl, value, client = mainFeedsCacheClient,
}) => client.SET(key, value, { EX: ttl });

exports.incr = ({ key, client = mainFeedsCacheClient }) => client.INCR(key);

exports.zincrby = ({
  key, increment, member, client = mainFeedsCacheClient,
}) => client.ZINCRBY(key, increment, member);

exports.expire = ({ key, ttl, client = mainFeedsCacheClient }) => client.EXPIRE(key, ttl);
