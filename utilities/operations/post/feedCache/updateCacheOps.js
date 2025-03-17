const mongoose = require('mongoose');
const _ = require('lodash');
const { redisSetter } = require('../../../redis');
const { find } = require('../../../../models/AppModel');
const Wobj = require('../../../../models/wObjectModel');
const Post = require('../../../../models/PostModel');
const { LANGUAGES } = require('../../../../constants/common');
const getPostsByCategory = require('../getPostsByCategory');
const { HOT_NEWS_CACHE_SIZE, TREND_NEWS_CACHE_SIZE, APPS_FOR_FEED_CACHE } = require('../../../../constants/postsData');

async function getDbPostsIds(type, appName) {
  let idsByWithLocales = [];
  switch (type) {
    case 'hot':
      idsByWithLocales = await Promise.all(LANGUAGES.map(async (locale) => {
        const { posts, error } = await getPostsByCategory({
          category: 'hot',
          skip: 0,
          limit: HOT_NEWS_CACHE_SIZE,
          user_languages: [locale],
          keys: '_id children',
          forApp: appName,
        });
        if (error) {
          console.error(error.message);
          return console.error(`getDbPostsIds Error, type: ${type} appName: ${appName}, locale: ${locale}`);
        }
        return { locale, ids: posts.map((post) => `${post.children}_${post._id}`) };
      }));
      break;
    case 'trending':
      idsByWithLocales = await Promise.all(LANGUAGES.map(async (locale) => {
        const { posts, error } = await getPostsByCategory({
          category: 'trending',
          skip: 0,
          limit: TREND_NEWS_CACHE_SIZE,
          user_languages: [locale],
          keys: '_id net_rshares',
          forApp: appName,
        });
        if (error) {
          console.error(error.message);
          return console.error(`getDbPostsIds Error, type: ${type} appName: ${appName}, locale: ${locale}`);
        }
        return { locale, ids: posts.map((post) => `${post.net_rshares}_${post._id}`) };
      }));
      break;
  }
  return idsByWithLocales.filter((arr) => _.get(arr, 'ids.length', 0) > 0);
}

const getFilteredDBPosts = async (trendingIds) => {
  const { result: wobject } = await Wobj.findOne({ author_permlink: 'xka-crypto-ia-wtrade' });
  const filteredIds = [];
  let filterPermlinks = [];
  try {
    const newsFilter = _.find(wobject.fields, (field) => field.name === 'newsFilter');
    const { allowList } = JSON.parse(newsFilter.body);
    filterPermlinks = _.flattenDeep(allowList);
  } catch (error) {
    return trendingIds;
  }
  for (const trendingLocales of trendingIds) {
    const localeIds = [];
    const ids = prepareIds(trendingLocales.ids);
    const { posts } = await Post.findByCondition({ _id: { $in: ids } });
    if (!posts) continue;
    for (const post of posts) {
      if (post && post.wobjects.length) {
        const wobjPermlinks = _.map(post.wobjects, 'author_permlink');
        if (_.intersection(filterPermlinks, wobjPermlinks).length) localeIds.push(`${post.net_rshares}_${post._id}`);
      }
    }
    filteredIds.push({ locale: trendingLocales.locale, ids: localeIds });
  }
  return filteredIds;
};

const prepareIds = (ids) => {
  const preparedIds = [];
  _.forEach(ids, (id) => {
    preparedIds.push(mongoose.Types.ObjectId(id.split('_')[1]));
  });
  return preparedIds;
};

exports.updateFeedsCache = async () => {
  // get array with ids by each language(locale)
  // for each App [{waivio:{locale: 'en-US', ids:['as87dfa8s'...]}}];
  const hotFeedAppCache = [];
  const trendFeedAppCache = [];
  let trendFilteredCryptoCache;
  const { result: apps = [], error } = await find({ host: { $in: APPS_FOR_FEED_CACHE } });
  if (error) {
    console.error('updateFeedsCache error');
    return;
  }
  for (const app of apps) {
    const hotIds = await getDbPostsIds('hot', app.name);
    const trendIds = await getDbPostsIds('trending', app.name);
    hotFeedAppCache.push({ appName: app.name, idsByLocales: hotIds });
    trendFeedAppCache.push({ appName: app.name, idsByLocales: trendIds });
    if (app.name === 'beaxy') {
      const trendFilteredIds = await getFilteredDBPosts(trendIds);
      trendFilteredCryptoCache = { appName: app.name, idsByLocales: trendFilteredIds };
    }
  }

  // and get feed ids without any app moderation settings
  // only separated by locales(languages)
  const hotFeedNoAppCache = await getDbPostsIds('hot');
  const trendFeedNoAppCache = await getDbPostsIds('trending');

  // update id lists in redis(feeds without app moderation)
  await Promise.all(hotFeedNoAppCache.map(async (localeFeed) => {
    await redisSetter.updateHotLocaleFeedCache(localeFeed);
  }));
  await Promise.all(trendFeedNoAppCache.map(async (localeFeed) => {
    await redisSetter.updateTrendLocaleFeedCache(localeFeed);
  }));

  // update id lists in redis(feeds with app moderation)
  // update HOT feeds by apps
  for (const hotLocalesFeed of hotFeedAppCache) {
    await Promise.all(hotLocalesFeed.idsByLocales.map(async (localFeed) => {
      await redisSetter.updateHotLocaleFeedCache({
        ids: localFeed.ids,
        locale: localFeed.locale,
        app: hotLocalesFeed.appName,
      });
    }));
  }
  // update TREND feeds by apps
  for (const trendLocalesFeed of trendFeedAppCache) {
    await Promise.all(trendLocalesFeed.idsByLocales.map(async (localFeed) => {
      await redisSetter.updateTrendLocaleFeedCache({
        ids: localFeed.ids,
        locale: localFeed.locale,
        app: trendLocalesFeed.appName,
      });
    }));
  }
  // update TREND filtered feeds for beaxy
  if (trendFilteredCryptoCache) {
    for (const trendFilteredLocalesFeed of trendFilteredCryptoCache.idsByLocales) {
      await redisSetter.updateFilteredTrendLocaleFeedCache({
        ids: trendFilteredLocalesFeed.ids,
        locale: trendFilteredLocalesFeed.locale,
        app: trendFilteredCryptoCache.appName,
      });
    }
  }
};
