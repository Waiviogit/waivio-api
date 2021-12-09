const _ = require('lodash');

exports.ERROR_MESSAGE = {
  UNAVAILABLE: 'Service Unavailable',
  PARSE_IMAGE: 'Error parse image',
  UPLOAD_IMAGE: 'Error upload image',
  NOT_FOUND: 'Not Found',
  WEBSITE_UNAVAILABLE: 'Website Temporary Unavailable',
};

exports.RESPONSE_STATUS = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  NOT_ACCEPTABLE: 406,
};

exports.ERROR_OBJ = {
  NOT_FOUND: {
    status: this.RESPONSE_STATUS.NOT_FOUND,
    message: this.ERROR_MESSAGE.NOT_FOUND,
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
};

exports.TOKEN = {
  HIVE: 'HIVE',
  HBD: 'HBD',
};

exports.DEVICE = {
  MOBILE: 'mobile',
};

exports.VIP_TICKET_PRICE = 5;

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
};

exports.WARNING_REQ_TIME = 15000;

exports.CACHE_KEY = {
  REWARD_FUND: 'reward_fund',
  CURRENT_MEDIAN_HISTORY_PRICE: 'current_median_history_price',
  SMT_POOL: 'smt_pool',
  CURRENT_PRICE_INFO: 'current_price_info',
};

exports.BLOCK_NUM_KEYS = {
  LAST_BLOCK_NUM: 'last_block_num',
  LAST_VOTE_BLOCK_NUM: 'last_vote_block_num',
  LAST_BLOCK_NUM_CAMPAIGN: 'campaign_last_block_num',
};

exports.REDIS_KEYS = {
  PROCESSED_LIKES: 'processed_likes',
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
