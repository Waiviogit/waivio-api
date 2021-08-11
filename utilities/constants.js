const _ = require('lodash');

exports.LANGUAGES = ['en-US',
  'id-ID',
  'ms-MY',
  'ca-ES',
  'cs-CZ',
  'da-DK',
  'de-DE',
  'et-EE',
  'es-ES',
  'fil-PH',
  'fr-FR',
  'hr-HR',
  'it-IT',
  'hu-HU',
  'nl-HU',
  'no-NO',
  'pl-PL',
  'pt-BR',
  'ro-RO',
  'sl-SI',
  'sv-SE',
  'vi-VN',
  'tr-TR',
  'yo-NG',
  'el-GR',
  'bg-BG',
  'ru-RU',
  'uk-UA',
  'he-IL',
  'ar-SA',
  'ne-NP',
  'hi-IN',
  'as-IN',
  'bn-IN',
  'ta-IN',
  'lo-LA',
  'th-TH',
  'ko-KR',
  'ja-JP',
  'zh-CN',
  'af-ZA',
  'auto',
];

exports.APP_LANGUAGES = _.filter(this.LANGUAGES, (el) => el !== 'auto');

exports.DAYS_FOR_HOT_FEED = 3;
exports.DAYS_FOR_TRENDING_FEED = 3;

// some fixed average Waivio rate of user
exports.MEDIAN_USER_WAIVIO_RATE = Number(process.env.MEDIAN_USER_WAIVIO_RATE) || 25000;
exports.COMMENT_REF_TYPES = {
  postWithWobjects: 'post_with_wobj',
  createWobj: 'create_wobj',
  appendWobj: 'append_wobj',
  wobjType: 'wobj_type',
};
exports.MAX_IMPORTING_USERS = 20;

exports.HOT_NEWS_CACHE_PREFIX = 'hot_locale_cache';
exports.HOT_NEWS_CACHE_SIZE = 1000;
exports.TREND_NEWS_CACHE_PREFIX = 'trend_locale_cache';
exports.TREND_FILTERED_NEWS_CACHE_PREFIX = 'trend_filtered_locale_cache';
exports.TREND_NEWS_CACHE_SIZE = 1000;

exports.WEBSITE_SUSPENDED_COUNT = 'website_suspended_count';

exports.PROXY_HIVE_IMAGES = 'https://images.hive.blog/0x0/';

exports.NOT_FOUND_IMAGE_URL = 'https://waivio.nyc3.digitaloceanspaces.com/ImageNotFound';
