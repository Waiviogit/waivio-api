const _ = require('lodash');
const config = require('config');
const { getNamespace } = require('cls-hooked');
const { redisGetter } = require('utilities/redis');
const { Post } = require('database').models;

/**
 * Get HOT posts by locales using indexes from redis cache
 * @param skip {Number}
 * @param limit {Number}
 * @param locales {[String]}
 * @param hiddenPosts {[String]}
 * @param forApp {String}
 * @returns {Promise<{posts}|{error: *}|undefined>}
 */
exports.getHot = async ({
  skip, limit, locales, forApp, hiddenPosts,
}) => {
  // get array of arrays of ids, for every locale
  const idLocaleArrays = await Promise.all(locales.map(async (locale) => {
    const { ids, error } = await redisGetter.getHotFeedCache({
      limit: limit + skip,
      locale,
      app: forApp,
    });
    if (error) {
      console.error(error);
    } else {
      return ids;
    }
  }));

  // get ids of needed posts range
  const postIds = getTopFromArrays(idLocaleArrays, limit, skip);
  const session = getNamespace('request-session');
  let host = session.get('host');
  if (!host) host = config.appHost;
  // get post from db by cached indexes
  return getFromDb({
    cond: { _id: { $in: _.difference(postIds, hiddenPosts) }, blocked_for_apps: { $ne: host } },
    sort: { children: -1 },
    limit,
    skip,
  });
};

/**
 * Get TRENDING posts by locales using indexes from redis cache
 * @param skip {Number}
 * @param limit {Number}
 * @param locales {[String]}
 * @param hiddenPosts {[String]}
 * @param forApp {String}
  * @param prefix
 * @returns {Promise<{posts}|{error: *}|undefined>}
 */
exports.getTrend = async ({
  skip, limit, locales, forApp, prefix, hiddenPosts,
}) => {
// get array of arrays of ids, for every locale
  const idLocaleArrays = await Promise.all(locales.map(async (locale) => {
    const { ids, error } = await redisGetter.getTrendFeedCache({
      limit: limit + skip,
      locale,
      app: forApp,
      prefix,
    });
    if (error) {
      console.error(error);
    } else {
      return ids;
    }
  }));

  // get ids of needed posts range
  const postIds = getTopFromArrays(idLocaleArrays, limit, skip);

  const session = getNamespace('request-session');
  let host = session.get('host');
  if (!host) host = config.appHost;
  // get post from db by cached indexes
  return getFromDb({
    cond: { _id: { $in: _.difference(postIds, hiddenPosts) }, blocked_for_apps: { $ne: host } },
    sort: { net_rshares: -1 },
    skip,
    limit,
  });
};

/*
Get top N items from several arrays of ids.
Instead of merge all items to on array, sort inside
and get top N => use this custom method for only
get top N items by compare each array top element.
 */
function getTopFromArrays(arrays, limit, skip) {
  return _
    .chain(arrays)
    .flattenDeep()
    .map((post) => {
      const data = post.split('_');
      return { id: data[1], weight: +data[0] };
    })
    .orderBy(['weight'], ['desc'])
    // .slice(skip, skip + limit)
    .map('id')
    .value();
}

const getFromDb = async ({
  cond, sort, skip, limit,
}) => {
  try {
    return {
      posts: await Post
        .find(cond)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate({ path: 'fullObjects', select: '-latest_posts' })
        .lean(),
    };
  } catch (error) {
    return { error };
  }
};
