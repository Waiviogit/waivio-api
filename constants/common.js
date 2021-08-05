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
};

exports.BLOCK_NUM_KEYS = {
  LAST_BLOCK_NUM: 'last_block_num',
  LAST_VOTE_BLOCK_NUM: 'last_vote_block_num',
  LAST_BLOCK_NUM_CAMPAIGN: 'campaign_last_block_num',
};
