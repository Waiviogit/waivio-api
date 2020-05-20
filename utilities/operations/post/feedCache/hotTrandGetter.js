const _ = require('lodash');
const { redisGetter } = require('utilities/redis');
const { Post } = require('database').models;

/**
 * Get HOT posts by locales using indexes from redis cache
 * @param skip {Number}
 * @param limit {Number}
 * @param locales {[String]}
 * @param forApp {String}
 * @returns {Promise<{posts}|{error: *}|undefined>}
 */
exports.getHot = async ({
  skip, limit, locales, forApp,
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
  const postIds = getTopFromArrays(idLocaleArrays, limit + skip).slice(skip);

  // get post from db by cached indexes
  return getFromDb({
    cond: { _id: { $in: postIds } },
    sort: { children: -1 },
  });
};

/**
 * Get TRENDING posts by locales using indexes from redis cache
 * @param skip {Number}
 * @param limit {Number}
 * @param locales {[String]}
 * @param forApp {String}
  * @param prefix
 * @returns {Promise<{posts}|{error: *}|undefined>}
 */
exports.getTrend = async ({
   skip, limit, locales, forApp, // prefix,
}) => {
// get array of arrays of ids, for every locale
  const idLocaleArrays = await Promise.all(locales.map(async (locale) => {
    const { ids, error } = await redisGetter.getTrendFeedCache({
      limit: limit + skip,
      locale,
      app: forApp,
      //prefix,
    });
    if (error) {
      console.error(error);
    } else {
      return ids;
    }
  }));

  // get ids of needed posts range
  const postIds = getTopFromArrays(idLocaleArrays, limit + skip).slice(skip);

  // get post from db by cached indexes
  return getFromDb({
    cond: { _id: { $in: postIds } },
    sort: { net_rshares: -1 },
  });
};

/**
 * Comparator for feed cache indexes,
 * use it for array.sort() by Descending order
 * @param a
 * @param b
 * @returns {number} For e.x. "X". X = 0 if equal, X<0 if a larger, X>0 if b larger
 */
function idComparator(a, b) {
  // in one of input items miss => return another item
  if (!a || !b) return a || b;
  const aNum = parseInt(a.split('_')[0], 10);
  const bNum = parseInt(b.split('_')[0], 10);
  return bNum - aNum;
}

function findLargestIndex(items, comparator) {
  let largestIndex = 0;
  for (const itemIdx in items) {
    if (comparator(items[itemIdx], items[largestIndex]) < 0) {
      largestIndex = itemIdx;
    }
  }
  return largestIndex;
}

/*
Get post Mongo _id from redis cache item
 */
const obtainPostId = (item) => item.split('_')[1];

/*
Get top N items from several arrays of ids.
Instead of merge all items to on array, sort inside
and get top N => use this custom method for only
get top N items by compare each array top element.
 */
function getTopFromArrays(arrays, topCount) {
  const indexes = _.times(arrays.length, () => 0);
  const result = [];
  while (result.length < topCount) {
    const topValues = indexes.map((value, idx) => _.get(arrays, `[${idx}][${value}]`));

    /* if every item in "topValues" is undefined/null
    it means that all arrays now is empty.
    Break the loop and return results */
    if (_.every(topValues, _.isNil)) break;

    // get index of array with current largest value
    const largestIndex = findLargestIndex(topValues, idComparator);
    /*
    arrays[largestIndex] => return index of feed by locale with largest item currently handling
    indexes[largestIndex] => return current handling index of item in specified feed locale
     */
    const topValue = _.get(arrays, `[${largestIndex}][${indexes[largestIndex]}]`);
    if (topValue) {
      result.push(obtainPostId(topValue));
    }

    indexes[largestIndex] += 1;
  }
  return result;
}

const getFromDb = async ({ cond, sort }) => {
  try {
    return {
      posts: await Post
        .find(cond)
        .sort(sort)
        .populate({ path: 'fullObjects', select: '-latest_posts' })
        .lean(),
    };
  } catch (error) {
    return { error };
  }
};
