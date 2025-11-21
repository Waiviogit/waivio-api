const telegramApi = {
  HOST: 'https://waiviodev.com',
  BASE_URL: '/telegram-api',
  SENTRY_ERROR: '/sentry',

};

const OBJECT_BOT = {
  production: {
    HOST: 'https://www.waivio.com',
    BASE_URL: '/objects-bot',
    CREATE_WEBSITE: '/create-site',
    DELETE_WEBSITE: '/delete-site',
    SEND_INVOICE: '/send-invoice',
  },
  staging: {
    HOST: 'https://waiviodev.com',
    BASE_URL: '/objects-bot',
    CREATE_WEBSITE: '/create-site',
    DELETE_WEBSITE: '/delete-site',
    SEND_INVOICE: '/send-invoice',
  },
  development: {
    HOST: 'http://localhost:8093',
    BASE_URL: '/objects-bot',
    CREATE_WEBSITE: '/create-site',
    DELETE_WEBSITE: '/delete-site',
    SEND_INVOICE: '/send-invoice',
  },
  test: {
    HOST: 'http://localhost:8093',
    BASE_URL: '/objects-bot',
    CREATE_WEBSITE: '/create-site',
    DELETE_WEBSITE: '/delete-site',
    SEND_INVOICE: '/send-invoice',
  },
};

const NOTIFICATIONS_API = {
  production: {
    HOST: 'https://www.waivio.com',
    BASE_URL: '/notifications-api',
    SET_NOTIFICATION: '/set',
    SET_SERVICE_NOTIFICATION: '/set-service',
  },
  staging: {
    HOST: 'https://waiviodev.com',
    BASE_URL: '/notifications-api',
    SET_NOTIFICATION: '/set',
    SET_SERVICE_NOTIFICATION: '/set-service',
  },
  development: {
    HOST: 'http://localhost:4000',
    BASE_URL: '/notifications-api',
    SET_NOTIFICATION: '/set',
    SET_SERVICE_NOTIFICATION: '/set-service',
  },
  test: {
    HOST: 'http://localhost:4000',
    BASE_URL: '/notifications-api',
    SET_NOTIFICATION: '/set',
    SET_SERVICE_NOTIFICATION: '/set-service',
  },
};

const CURRENCIES_API = {
  production: {
    HOST: 'https://www.waivio.com',
    BASE_URL: '/currencies-api',
    RATE: '/rate',
    LATEST: '/latest',
    ENGINE_CURRENT: '/engine-current',
  },
  staging: {
    HOST: 'https://waiviodev.com',
    BASE_URL: '/currencies-api',
    RATE: '/rate',
    LATEST: '/latest',
    ENGINE_CURRENT: '/engine-current',
  },
  development: {
    HOST: 'http://localhost:8001',
    BASE_URL: '/currencies-api',
    RATE: '/rate',
    LATEST: '/latest',
    ENGINE_CURRENT: '/engine-current',
  },
  test: {
    HOST: 'http://localhost:8001',
    BASE_URL: '/currencies-api',
    RATE: '/rate',
    LATEST: '/latest',
    ENGINE_CURRENT: '/engine-current',
  },
};

const GEO_IP_API = 'https://extreme-ip-lookup.com/json/';

const HIVE_ON_BOARD = {
  HOST: 'https://hiveonboard.com',
  BASE_URL: '/api',
  TICKETS: '/tickets',
};

const PRODUCTION_REQUEST_NODES = [
  'https://api.deathwing.me',
  'https://api.hive.blog',
  'https://api.openhive.network',
  'https://rpc.mahdiyari.info',
  'https://hive-api.3speak.tv',
];

const STAGING_REQUEST_NODES = [
  'https://api.deathwing.me',
  'https://api.hive.blog',
  'https://api.openhive.network',
  'https://rpc.mahdiyari.info',
  'https://hive-api.3speak.tv',
];

const NODE_URLS = process.env.NODE_ENV === 'production'
  ? PRODUCTION_REQUEST_NODES
  : STAGING_REQUEST_NODES;

const KEY_CHAIN_URL = {
  DELEGATORS: 'https://api.hive-keychain.com/hive/delegators/',
};

module.exports = {
  NODE_URLS,
  GEO_IP_API,
  telegramApi,
  HIVE_ON_BOARD,
  KEY_CHAIN_URL,
  OBJECT_BOT: OBJECT_BOT[process.env.NODE_ENV || 'development'],
  NOTIFICATIONS_API: NOTIFICATIONS_API[process.env.NODE_ENV || 'development'],
  CURRENCIES_API: CURRENCIES_API[process.env.NODE_ENV || 'development'],
};
