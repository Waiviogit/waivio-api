const _ = require('lodash');
const config = require('config');
const {
  DAYS_FOR_HOT_FEED, DAYS_FOR_TRENDING_FEED, MEDIAN_USER_WAIVIO_RATE,
  HOT_NEWS_CACHE_SIZE, TREND_NEWS_CACHE_SIZE, TREND_NEWS_CACHE_PREFIX,
  TREND_FILTERED_NEWS_CACHE_PREFIX,
} = require('utilities/constants');
const { getNamespace } = require('cls-hooked');
const { ObjectId } = require('mongoose').Types;
const { Post } = require('database').models;
const hotTrandGetter = require('./feedCache/hotTrandGetter');

const objectIdFromDaysBefore = (daysCount) => {
  const startDate = new Date();

  startDate.setDate(startDate.getDate() - daysCount);
  startDate.setMilliseconds(0);
  startDate.setSeconds(0);
  startDate.setMinutes(0);
  startDate.setHours(0);
  const str = `${Math.floor(startDate.getTime() / 1000).toString(16)}0000000000000000`;

  return new ObjectId(str);
};

// eslint-disable-next-line camelcase
const makeConditions = ({
  category, user_languages: languages, forApp, lastId,
}) => {
  let cond = {};
  let sort = {};

  const session = getNamespace('request-session');
  let host = session.get('host');
  if (!host) host = config.appHost;
  switch (category) {
    case 'created':
      cond = { reblog_to: null };
      // alternative infinity scroll key(don't use skip if lastId exist)
      if (lastId) {
        cond._id = { $lt: new ObjectId(lastId) };
      }
      sort = { _id: -1 };
      break;
    case 'hot':
      cond = {
        _id: { $gte: objectIdFromDaysBefore(DAYS_FOR_HOT_FEED) },
        author_weight: { $gte: MEDIAN_USER_WAIVIO_RATE },
        reblog_to: null,
      };
      sort = { children: -1 };
      break;
    case 'trending':
      cond = {
        _id: { $gte: objectIdFromDaysBefore(DAYS_FOR_TRENDING_FEED) },
        author_weight: { $gte: MEDIAN_USER_WAIVIO_RATE },
        reblog_to: null,
      };
      sort = { net_rshares: -1 };
      break;
  }
  if (!_.isEmpty(languages)) cond.language = { $in: languages };
  if (forApp) cond.blocked_for_apps = { $ne: forApp };
  cond.blocked_for_apps = { $nin: [host] };
  return { cond, sort };
};

module.exports = async ({
  // eslint-disable-next-line camelcase
  category, skip, limit, user_languages, keys, forApp, lastId, onlyCrypto,
}) => {
  // try to get posts from cache
  const cachedPosts = await getFromCache({
    skip, limit, user_languages, category, forApp, onlyCrypto,
  });
  if (cachedPosts) return { posts: cachedPosts };
  if (!cachedPosts && onlyCrypto) return { posts: [] };
  const { cond, sort } = makeConditions({
    category, user_languages, forApp, lastId,
  });

  const postsQuery = Post
    .find(cond)
    .sort(sort)
  // .skip(skip)
    .limit(limit)
    .populate({ path: 'fullObjects', select: 'parent fields weight author_permlink object_type default_name' })
    .select(keys || {})
    .lean();
  if (!lastId) postsQuery.skip(skip);

  let posts = [];

  try {
    posts = await postsQuery.exec();
  } catch (error) {
    return { error };
  }
  return { posts };
};

const getFromCache = async ({
  skip, limit, user_languages: locales, category, forApp, onlyCrypto,
}) => {
  if (onlyCrypto) category = 'beaxyWObjCache';
  let res;
  switch (category) {
    case 'hot':
      if ((skip + limit) < HOT_NEWS_CACHE_SIZE) {
        res = await hotTrandGetter.getHot({
          skip, limit, locales, forApp,
        });
      }
      break;
    case 'beaxyWObjCache':
      if ((skip + limit) < TREND_NEWS_CACHE_SIZE) {
        res = await hotTrandGetter.getTrend({
          skip, limit, locales, forApp, prefix: TREND_FILTERED_NEWS_CACHE_PREFIX,
        });
      }
      break;
    case 'trending':
      if ((skip + limit) < TREND_NEWS_CACHE_SIZE) {
        res = await hotTrandGetter.getTrend({
          skip, limit, locales, forApp, prefix: TREND_NEWS_CACHE_PREFIX,
        });
      }
      break;
  }
  if (_.get(res, 'posts.length')) {
    return res.posts;
  }
};
