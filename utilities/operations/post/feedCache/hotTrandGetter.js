const _ = require('lodash');
const config = require('config');
const { redisGetter } = require('utilities/redis');
const { Post } = require('database').models;
const { IGNORED_AUTHORS } = require('constants/postsData');
const asyncLocalStorage = require('../../../../middlewares/context/context');

/**
 * Get HOT posts by locales using indexes from redis cache
 * @param skip {Number}
 * @param limit {Number}
 * @param locales {[String]}
 * @param hiddenPosts {[String]}
 * @param muted {[String]}
 * @param forApp {String}
 * @returns {Promise<{posts}|{error: *}|undefined>}
 */
exports.getHot = async ({
  skip, limit, locales, forApp, hiddenPosts, muted,
}) => {
  // get array of arrays of ids, for every locale
  const idLocaleArrays = await Promise.all(locales.map(async (locale) => {
    const { ids, error } = await redisGetter.getHotFeedCache({
      limit: limit + skip,
      locale,
      app: forApp,
    });
    if (error) {
      console.error('getHot Error');
    } else {
      return ids;
    }
  }));

  // get ids of needed posts range
  const postIds = this.getTopFromArrays(idLocaleArrays, limit, skip);
  const store = asyncLocalStorage.getStore();
  let host = store.get('host');
  if (!host) host = config.appHost;
  // get post from db by cached indexes
  return getFromDb({
    cond: {
      _id: { $in: _.difference(postIds, hiddenPosts) },
      blocked_for_apps: { $ne: host },
      author: { $nin: muted },
    },
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
 * @param muted {[String]}
 * @param forApp {String}
  * @param prefix
 * @returns {Promise<{posts}|{error: *}|undefined>}
 */
exports.getTrend = async ({
  skip, limit, locales, forApp, prefix, hiddenPosts, muted,
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
      console.error('getTrend Error');
    } else {
      return ids;
    }
  }));

  // get ids of needed posts range
  const postIds = this.getTopFromArrays(idLocaleArrays, limit, skip);
  const store = asyncLocalStorage.getStore();

  let host = store.get('host');
  if (!host) host = config.appHost;
  // get post from db by cached indexes
  return getFromDb({
    cond: {
      _id: { $in: _.difference(postIds, hiddenPosts) },
      blocked_for_apps: { $ne: host },
      author: { $nin: _.union(muted, IGNORED_AUTHORS) },
    },
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
exports.getTopFromArrays = (arrays, limit, skip) => _
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
