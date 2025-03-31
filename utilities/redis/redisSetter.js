const {
  TREND_NEWS_CACHE_PREFIX, HOT_NEWS_CACHE_PREFIX, TREND_FILTERED_NEWS_CACHE_PREFIX,
} = require('../../constants/postsData');
const { WEBSITE_SUSPENDED_COUNT } = require('../../constants/sitesConstants');
const {
  importUserClient,
  mainFeedsCacheClient,
  tagCategoriesClient,
  appUsersStatistics,
  processedPostClient,
} = require('./redis');
const { TOP_WOBJ_USERS_KEY, FIELDS_NAMES } = require('../../constants/wobjectsData');
const { LANGUAGES } = require('../../constants/common');

exports.addTopWobjUsers = async (permlink, ids) => mainFeedsCacheClient.sadd(`${TOP_WOBJ_USERS_KEY}:${permlink}`, ...ids);

/**
 * Set active users to redis for collect statistics and invoicing
 */
exports.addSiteActiveUser = async (key, ip) => appUsersStatistics.sadd(key, ip);

/**
 * Add user name to namespace of currently importing users
 * @param userName {String}
 * @returns {Promise<void>}
 */
exports.addImportedUser = async (userName) => importUserClient.set(`import_user:${userName}`, new Date().toISOString());

/**
 * Add user name to namespace of currently importing users
 * @param userName {String}
 * @param errorMessage {String}
 * @returns {Promise<void>}
 */
exports.setImportedUserError = async (userName, errorMessage) => importUserClient.set(`import_user_error:${userName}`, errorMessage);

/**
 * @param key {String}
 * @param client {}
 */
exports.deleteKey = async ({ key, client = importUserClient }) => client.del(key);

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
  return mainFeedsCacheClient.rpush([`${appPrefix}${TREND_NEWS_CACHE_PREFIX}:${locale}`, ...ids]);
};

exports.updateFilteredTrendLocaleFeedCache = async ({ ids, locale, app }) => {
  if (!validateUpdateNewsCache(ids, locale) || !ids.length) return;
  await clearFeedLocaleCache({ prefix: TREND_FILTERED_NEWS_CACHE_PREFIX, app, locale });
  const appPrefix = app ? `${app}:` : '';
  return mainFeedsCacheClient.rpush([`${appPrefix}${TREND_FILTERED_NEWS_CACHE_PREFIX}:${locale}`, ...ids]);
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
  return mainFeedsCacheClient.rpush([`${appPrefix}${HOT_NEWS_CACHE_PREFIX}:${locale}`, ...ids]);
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

exports.addTagCategory = async ({ categoryName, tags }) => tagCategoriesClient.zadd(`${FIELDS_NAMES.TAG_CATEGORY}:${categoryName}`, tags);
exports.incrementTag = async ({ categoryName, tag, objectType }) => tagCategoriesClient.zincrby(`${FIELDS_NAMES.TAG_CATEGORY}:${objectType}:${categoryName}`, 1, tag);
exports.incrementDepartmentTag = async ({ categoryName, tag, department }) => tagCategoriesClient.zincrby(`${FIELDS_NAMES.DEPARTMENTS}:${department}:${categoryName}`, 1, tag);

exports.incrementWebsitesSuspended = async ({ key, expire }) => {
  const counter = await appUsersStatistics.incr(`${WEBSITE_SUSPENDED_COUNT}:${key}`);
  await appUsersStatistics.expire(`${WEBSITE_SUSPENDED_COUNT}:${key}`, expire);
  return counter;
};

exports.importUserClientHMSet = async ({ key, data, expire }) => {
  await importUserClient.hset(key, data);
  await importUserClient.expire(key, expire);
};

exports.hmsetAsync = async ({ key, data, client = importUserClient }) => {
  try {
    return { result: await client.hset(key, data) };
  } catch (error) {
    return { error };
  }
};

exports.zadd = async ({
  key, now, keyValue, client = processedPostClient,
}) => client.zadd(key, {
  score: now, value: keyValue,
});

exports.saddAsync = async ({ key, values, client }) => client.sadd(key, values);

exports.set = ({ key, value, client = mainFeedsCacheClient }) => client.set(key, value);

exports.setEx = ({
  key, ttl, value, client = mainFeedsCacheClient,
}) => client.setex(key, ttl, value);

exports.incr = ({ key, client = mainFeedsCacheClient }) => client.incr(key);

exports.zincrby = ({
  key, increment, member, client = mainFeedsCacheClient,
}) => client.zincrby(key, increment, member);

exports.expire = ({ key, ttl, client = mainFeedsCacheClient }) => client.expire(key, ttl);

exports.zincrbyExpire = async ({
  key, increment, member, ttl, client = appUsersStatistics,
}) => {
  try {
    await client.multi()
      .zincrby(key, increment, member)
      .expire(key, ttl)
      .exec();
  } catch (error) {
    console.log(error.message);
  }
};

exports.incrExpire = async ({ key, ttl, client = importUserClient }) => {
  try {
    await client.multi()
      .incr(key)
      .expire(key, ttl)
      .exec();
  } catch (error) {
    console.log(error.message);
  }
};

exports.sremAsync = async ({ key, value, client }) => client.sremAsync({ key, value });
