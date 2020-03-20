const _ = require('lodash');
const {
  DAYS_FOR_HOT_FEED, DAYS_FOR_TRENDING_FEED, MEDIAN_USER_WAIVIO_RATE,
  HOT_NEWS_CACHE_SIZE, TREND_NEWS_CACHE_SIZE,
} = require('utilities/constants');
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
const makeConditions = ({ category, user_languages }) => {
  let cond = {};
  let sort = {};

  switch (category) {
    case 'created':
      cond = { reblog_to: null };
      sort = { _id: -1 };
      break;
    case 'hot':
      cond = {
        _id: { $gte: objectIdFromDaysBefore(DAYS_FOR_HOT_FEED) },
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
  if (!_.isEmpty(user_languages)) cond.language = { $in: user_languages };
  return { cond, sort };
};

module.exports = async ({
  // eslint-disable-next-line camelcase
  category, skip, limit, user_languages, keys,
}) => {
  // try to get posts from cache
  const cachedPosts = await getFromCache({
    skip, limit, user_languages, category,
  });
  if (cachedPosts) return { posts: cachedPosts };

  const { cond, sort } = makeConditions({ category, user_languages });
  let posts = [];

  try {
    posts = await Post
      .find(cond)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({ path: 'fullObjects', select: '-latest_posts' })
      .select(keys || {})
      .lean();
  } catch (error) {
    return { error };
  }
  return { posts };
};

const getFromCache = async ({
  skip, limit, user_languages: locales, category,
}) => {
  let res;
  switch (category) {
    case 'hot':
      if ((skip + limit) < HOT_NEWS_CACHE_SIZE) {
        res = await hotTrandGetter.getHot({ skip, limit, locales });
      }
      break;
    case 'trending':
      if ((skip + limit) < TREND_NEWS_CACHE_SIZE) {
        res = await hotTrandGetter.getTrend({ skip, limit, locales });
      }
      break;
  }
  if (_.get(res, 'posts.length')) {
    return res.posts;
  }
};
