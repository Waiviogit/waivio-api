const { getPostsByCategory } = require('utilities/operations/post');
const { redisSetter } = require('utilities/redis');
const { LANGUAGES, HOT_NEWS_CACHE_SIZE, TREND_NEWS_CACHE_SIZE } = require('utilities/constants');

async function getDbPostsIds(type) {
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
  // array of objects {locale:'en-US', ids:['123_asdf'...]}
  const hotFeedCache = await getDbPostsIds('hot');
  const trendFeedCache = await getDbPostsIds('trending');

  // update id lists in redis
  await Promise.all(hotFeedCache.map(async (localeFeed) => {
    await redisSetter.updateHotLocaleFeedCache(localeFeed);
  }));
  await Promise.all(trendFeedCache.map(async (localeFeed) => {
    await redisSetter.updateTrendLocaleFeedCache(localeFeed);
  }));
};
