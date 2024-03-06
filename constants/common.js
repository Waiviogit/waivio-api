const _ = require('lodash');

exports.ERROR_MESSAGE = {
  UNAVAILABLE: 'Service Unavailable',
  PARSE_IMAGE: 'Error parse image',
  UPLOAD_IMAGE: 'Error upload image',
  NOT_FOUND: 'Not Found',
  WEBSITE_UNAVAILABLE: 'Website Temporary Unavailable',
  FORBIDDEN: 'Forbidden',
  UNPROCESSABLE: 'Unprocessable Entity',
};

exports.RESPONSE_STATUS = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  NOT_ACCEPTABLE: 406,
  UNPROCESSABLE: 422,
};

exports.ERROR_OBJ = {
  NOT_FOUND: {
    status: this.RESPONSE_STATUS.NOT_FOUND,
    message: this.ERROR_MESSAGE.NOT_FOUND,
  },
  FORBIDDEN: {
    status: this.RESPONSE_STATUS.FORBIDDEN,
    message: this.ERROR_MESSAGE.FORBIDDEN,
  },
  UNPROCESSABLE: {
    status: this.RESPONSE_STATUS.UNPROCESSABLE,
    message: this.ERROR_MESSAGE.UNPROCESSABLE,
  },
};

exports.REQ_METHOD = {
  POST: 'POST',
};

exports.URL = {
  API: '/api',
  SITES: '/sites',
  HTTPS: 'https://',
};

exports.AWSS3_IMAGE_PARAMS = {
  Bucket: 'waivio',
  ACL: 'public-read',
  ContentType: 'image/webp',
  ContentEncoding: 'base64',
};

exports.IMAGE_SIZE = {
  SMALL: '_small',
  MEDIUM: '_medium',
  CONTAIN: '_contain',
};

exports.IMAGES_FORMAT = {
  WEBP: 'webp',
  GIF: 'gif',
};

exports.TOKEN = {
  HIVE: 'HIVE',
  HBD: 'HBD',
};

exports.DEVICE = {
  MOBILE: 'mobile',
};

exports.VIP_TICKET_PRICE = 3;

exports.SUPPORTED_CURRENCIES = {
  USD: 'USD',
  CAD: 'CAD',
  EUR: 'EUR',
  AUD: 'AUD',
  MXN: 'MXN',
  GBP: 'GBP',
  JPY: 'JPY',
  CNY: 'CNY',
  RUB: 'RUB',
  UAH: 'UAH',
  CHF: 'CHF',
};

exports.CURSOR_TIMEOUT = 60000;
exports.WARNING_REQ_TIME = 30000;
exports.REQUEST_TIMEOUT = 15000;

exports.CACHE_KEY = {
  REWARD_FUND: 'reward_fund',
  CURRENT_MEDIAN_HISTORY_PRICE: 'current_median_history_price',
  SMT_POOL: 'smt_pool',
  CURRENT_PRICE_INFO: 'current_price_info',
  LIST_ITEMS_COUNT: 'listItemsCount',
  USER_SHOP_DEPARTMENTS: 'userShopDepartments',
  OBJECT_SHOP_DEPARTMENTS: 'objectShopDepartments',
  MAIN_SHOP_DEPARTMENTS: 'mainShopDepartments',
};

exports.TTL_TIME = {
  ONE_MINUTE: 60,
  TEN_MINUTES: 60 * 10,
  THIRTY_MINUTES: 1800,
  ONE_DAY: 86400,
  SEVEN_DAYS: 86400 * 7,
  THIRTY_DAYS: 86400 * 30,
};

exports.BLOCK_NUM_KEYS = {
  LAST_BLOCK_NUM: 'last_block_num',
  LAST_VOTE_BLOCK_NUM: 'last_vote_block_num',
  LAST_BLOCK_NUM_CAMPAIGN: 'campaign_last_block_num',
};

exports.REDIS_KEYS = {
  PROCESSED_LIKES_HIVE: 'processed_likes:hive',
  PROCESSED_LIKES_ENGINE: 'processed_likes:engine',
  CACHE_SERVICE_BOTS: 'service_bots',
  TEST_LOAD: {
    BLOCK: 'test:hive:blocks',
    POST: 'test:hive:post',
    HISTORY: 'test:hive:history',
    ENGINE_BLOCKCHAIN: 'test:engine:blockchain',
    ENGINE_CONTRACTS: 'test:engine:contracts',
  },
  REQUESTS_RATE: 'requests:api:',
  REQUESTS_TIME: 'requests:time:api',
  REQUESTS_BY_URL: 'requests:url:api',
  AD_SENSE: 'ad_sense_cache',
  ENGINE_RATE: 'engine_rate',
  API_RES_CACHE: 'api_res_cache',
  API_VISIT_STATISTIC: 'api_visit_statistic',
  API_RATE_LIMIT_BOTS: 'api_rate_limit_bots',
  API_RATE_LIMIT_COUNTER: 'api_rate_limit_counter',
};

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

exports.LANGUAGES_POPULARITY = [
  { lang: 'en-US', score: 1 },
  { lang: 'zh-CN', score: 2 },
  { lang: 'es-ES', score: 3 },
  { lang: 'ar-SA', score: 4 },
  { lang: 'pt-BR', score: 5 },
  { lang: 'ms-MY', score: 6 },
  { lang: 'fr-FR', score: 7 },
  { lang: 'ja-JP', score: 8 },
  { lang: 'ru-RU', score: 9 },
  { lang: 'de-DE', score: 10 },
  { lang: 'uk-UA', score: 11 },
];

exports.APP_LANGUAGES = _.filter(this.LANGUAGES, (el) => el !== 'auto');

exports.COMMENT_REF_TYPES = {
  postWithWobjects: 'post_with_wobj',
  createWobj: 'create_wobj',
  appendWobj: 'append_wobj',
  wobjType: 'wobj_type',
};

exports.MAX_IMPORTING_USERS = 20;

exports.PROXY_HIVE_IMAGES = 'https://images.hive.blog/0x0/';

exports.NOT_FOUND_IMAGE_URL = 'https://waivio.nyc3.digitaloceanspaces.com/ImageNotFound';

exports.WAIVIO_ADMINS = 'waivio_admins';

exports.GUEST_WALLET_TYPE = Object.freeze({
  AUTHOR_REWARD: 'comments_authorReward',
  TRANSFER: 'tokens_transfer',
  WITHDRAW: 'guest_withdraw',
});

exports.AGGREGATION_MAX_TIME = 15000;
