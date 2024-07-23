/* eslint-disable camelcase */
const {
  IGNORED_AUTHORS, DAYS_FOR_HOT_FEED, DAYS_FOR_TRENDING_FEED,
  MEDIAN_USER_WAIVIO_RATE, IGNORED_AUTHORS_HOT,
} = require('constants/postsData');
const { hiddenPostModel, mutedUserModel } = require('models');
const { ObjectId } = require('mongoose').Types;
const { getNamespace } = require('cls-hooked');
const { Post } = require('database').models;
const config = require('config');
const _ = require('lodash');
const { getCachedPosts, setCachedPosts, getPostCacheKey } = require('utilities/helpers/postHelper');
const { postHelper } = require('../../helpers');
const wobjectHelper = require('../../helpers/wObjectHelper');
const { fillPostsSubscriptions } = require('../../helpers/subscriptionHelper');

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

const makeConditions = ({
  category, user_languages: languages, host, hiddenPosts, muted,
}) => {
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
        author_weight: { $gte: MEDIAN_USER_WAIVIO_RATE },
        reblog_to: null,
        author: { $nin: IGNORED_AUTHORS_HOT },
      };
      sort = { children: -1 };
      break;
    case 'trending':
      cond = {
        _id: { $gte: objectIdFromDaysBefore(DAYS_FOR_TRENDING_FEED) },
        author_weight: { $gte: MEDIAN_USER_WAIVIO_RATE },
        reblog_to: null,
        author: { $nin: IGNORED_AUTHORS },
      };
      sort = { net_rshares: -1 };
      break;
  }
  if (!_.isEmpty(languages)) cond.language = { $in: languages };
  if (!_.isEmpty(hiddenPosts)) {
    _.get(cond, '_id')
      ? Object.assign(cond._id, { $nin: hiddenPosts })
      : cond._id = { $nin: hiddenPosts };
  }
  if (!_.isEmpty(muted)) {
    _.get(cond, 'author')
      ? Object.assign(cond.author, { $nin: _.union(muted, IGNORED_AUTHORS) })
      : cond.author = { $nin: muted };
  }
  cond.blocked_for_apps = { $nin: [host] };
  return { cond, sort };
};

// to helpers

module.exports = async ({
  category, skip, limit, user_languages, userName, locale, app,
}) => {
  const session = getNamespace('request-session');
  let host = session.get('host');
  if (!host) host = config.appHost;

  const cacheKey = getPostCacheKey({
    category, skip, limit, user_languages, host, userName, method: 'getPostsByCategory',
  });

  if (category !== 'created') {
    const cache = await getCachedPosts(cacheKey);
    if (cache) return { posts: cache };
  }

  // get user blocked posts id
  // get user muted list
  const hide = await Promise.all([
    await hiddenPostModel.getHiddenPosts(userName, { postId: -1 }),
    await mutedUserModel.find({ condition: { mutedBy: userName } }),
  ]);
  const [{ hiddenPosts }, { result: muted }] = hide;

  const { cond, sort } = makeConditions({
    category, user_languages, host, hiddenPosts, muted: _.map(muted, 'userName'),
  });

  const postsQuery = Post
    .find(cond)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate({ path: 'fullObjects', select: 'parent fields weight author_permlink object_type default_name' })
    .lean();

  let posts = [];

  try {
    posts = await postsQuery.exec();
  } catch (error) {
    return { error };
  }
  // refactor from middlewares

  posts = await postHelper.fillAdditionalInfo({ posts, userName });
  await wobjectHelper.moderatePosts({ posts, locale, app });
  await fillPostsSubscriptions({ posts, userName });

  if (category !== 'created') {
    await setCachedPosts({ key: cacheKey, posts, ttl: 60 * 30 });
  }
  return { posts };
};
