const { getAll: getAllApps } = require('models/AppModel');
const getPostsByCategory = require('utilities/operations/post/getPostsByCategory');
const { redisSetter } = require('utilities/redis');
const { LANGUAGES, HOT_NEWS_CACHE_SIZE, TREND_NEWS_CACHE_SIZE } = require('utilities/constants');

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
          return console.error(error);
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
          return console.error(error);
        }
        return { locale, ids: posts.map((post) => `${post.net_rshares}_${post._id}`) };
      }));
      break;
  }
  return idsByWithLocales.filter((arr) => arr.ids.length > 0);
}

exports.updateFeedsCache = async () => {
  // get array with ids by each language(locale)
  // for each App [{waivio:{locale: 'en-US', ids:['as87dfa8s'...]}}];
  const hotFeedAppCache = [];
  const trendFeedAppCache = [];
  const { apps = [], error } = await getAllApps();
  if (error) {
    console.error(error);
    return;
  }
  for (const app of apps) {
    const hotIds = await getDbPostsIds('hot', app.name);
    const trendIds = await getDbPostsIds('trending', app.name);
    hotFeedAppCache.push({ appName: app.name, idsByLocales: hotIds });
    trendFeedAppCache.push({ appName: app.name, idsByLocales: trendIds });
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
};
