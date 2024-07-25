exports.APPS_FOR_FEED_CACHE = ['waiviodev.com', 'waivio.com'];
exports.IGNORED_AUTHORS = ['hbd.funder'];
exports.IGNORED_AUTHORS_HOT = ['ecency.waves', 'leothreads'];

exports.DAYS_FOR_HOT_FEED = 3;
exports.DAYS_FOR_TRENDING_FEED = 3;

exports.HOT_NEWS_CACHE_SIZE = 1000;
exports.TREND_NEWS_CACHE_SIZE = 1000;

exports.HOT_NEWS_CACHE_PREFIX = 'hot_locale_cache';
exports.TREND_NEWS_CACHE_PREFIX = 'trend_locale_cache';
exports.TREND_FILTERED_NEWS_CACHE_PREFIX = 'trend_filtered_locale_cache';

exports.MEDIAN_USER_WAIVIO_RATE = Number(process.env.MEDIAN_USER_WAIVIO_RATE) || 25000;
