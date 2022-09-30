/* eslint-disable camelcase */
const {
  IGNORED_AUTHORS, DAYS_FOR_HOT_FEED, DAYS_FOR_TRENDING_FEED, HOT_NEWS_CACHE_SIZE,
  TREND_NEWS_CACHE_SIZE, TREND_NEWS_CACHE_PREFIX, TREND_FILTERED_NEWS_CACHE_PREFIX,
  MEDIAN_USER_WAIVIO_RATE,
} = require('constants/postsData');
const hotTrandGetter = require('utilities/operations/post/feedCache/hotTrandGetter');
const { hiddenPostModel, mutedUserModel } = require('models');
const { ObjectId } = require('mongoose').Types;
const { getNamespace } = require('cls-hooked');
const { Post } = require('database').models;
const config = require('config');
const crypto = require('crypto');
const _ = require('lodash');
const { getCachedPosts, setCachedPosts } = require('utilities/helpers/postHelper');
const { postHelper } = require('../../helpers');
const wobjectHelper = require('../../helpers/wObjectHelper');
const { REQUIREDFILDS_WOBJ_LIST } = require('../../../constants/wobjectsData');
const { Subscriptions } = require('../../../models');
const { getFollowingsUser } = require('../user');

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

const getKey = ({
  category, skip, limit, user_languages, host, userName,
}) => crypto
  .createHash('md5')
  .update(`${category}${skip}${limit}${user_languages.toString()}${host}${userName}`, 'utf8')
  .digest('hex');
// to helpers

module.exports = async ({
  category, skip, limit, user_languages, userName, locale, app,
}) => {
  const session = getNamespace('request-session');
  let host = session.get('host');
  if (!host) host = config.appHost;
  const cacheKey = getKey({
    category, skip, limit, user_languages, host, userName,
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

  await postHelper.fillReblogs(posts, userName);
  posts = await postHelper.fillObjects(posts, userName);
  await postHelper.addAuthorWobjectsWeight(posts);
  posts = await postHelper.additionalSponsorObligations(posts);
  await Promise.all(posts.map(async (post) => {
    if (post.wobjects) {
      post.wobjects = await wobjectHelper.processWobjects({
        wobjects: post.wobjects,
        app,
        hiveData: false,
        returnArray: true,
        locale,
        fields: REQUIREDFILDS_WOBJ_LIST,
      });
    }
  }));
  const names = _.map(posts, (follower) => follower.author);

  const { subscriptionData } = await Subscriptions
    .find({ condition: { follower: { $in: names }, following: userName } });

  _.forEach(posts, (follower) => {
    follower.followsYou = !!_.find(subscriptionData, (el) => el.follower === follower.name);
  });
  const names2 = _.map(posts, (following) => following.author);
  const { users, error } = await getFollowingsUser.getFollowingsArray(
    { name: userName, users: names2 },
  );
  if (error) return { error };

  _.forEach(posts, (following) => {
    const result = _.find(users, (user) => Object.keys(user)[0] === following.author);
    following.youFollows = result[following.author];
  });

  if (category !== 'created') {
    await setCachedPosts({ key: cacheKey, posts, ttl: 60 * 30 });
  }
  return { posts };
};

const getFromCache = async ({
  skip, limit, user_languages: locales, category, forApp, onlyCrypto, hiddenPosts, muted,
}) => {
  if (onlyCrypto) category = 'beaxyWObjCache';
  let res;
  switch (category) {
    case 'hot':
      if ((skip + limit) < HOT_NEWS_CACHE_SIZE) {
        res = await hotTrandGetter.getHot({
          skip, limit, locales, forApp, hiddenPosts, muted,
        });
      }
      break;
    case 'beaxyWObjCache':
      if ((skip + limit) < TREND_NEWS_CACHE_SIZE) {
        res = await hotTrandGetter.getTrend({
          skip,
          limit,
          muted,
          forApp,
          locales,
          hiddenPosts,
          prefix: TREND_FILTERED_NEWS_CACHE_PREFIX,
        });
      }
      break;
    case 'trending':
      if ((skip + limit) < TREND_NEWS_CACHE_SIZE) {
        res = await hotTrandGetter.getTrend({
          skip, limit, locales, forApp, prefix: TREND_NEWS_CACHE_PREFIX, hiddenPosts, muted,
        });
      }
      break;
  }
  if (_.get(res, 'posts.length')) {
    return res.posts;
  }
};
