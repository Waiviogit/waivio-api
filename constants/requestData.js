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
  },
  staging: {
    HOST: 'https://waiviodev.com',
    BASE_URL: '/notifications-api',
    SET_NOTIFICATION: '/set',
  },
  development: {
    HOST: 'http://localhost:4000',
    BASE_URL: '/notifications-api',
    SET_NOTIFICATION: '/set',
  },
  test: {
    HOST: 'http://localhost:4000',
    BASE_URL: '/notifications-api',
    SET_NOTIFICATION: '/set',
  },
};

const CURRENCIES_API = {
  production: {
    HOST: 'https://www.waivio.com',
    BASE_URL: '/currencies-api',
    RATE: '/rate',
    LATEST: '/latest',
  },
  staging: {
    HOST: 'https://waiviodev.com',
    BASE_URL: '/currencies-api',
    RATE: '/rate',
    LATEST: '/latest',
  },
  development: {
    HOST: 'http://localhost:8001',
    BASE_URL: '/currencies-api',
    RATE: '/rate',
    LATEST: '/latest',
  },
  test: {
    HOST: 'http://localhost:8001',
    BASE_URL: '/currencies-api',
    RATE: '/rate',
    LATEST: '/latest',
  },
};

const GEO_IP_API = 'https://extreme-ip-lookup.com/json/';

const HIVE_ON_BOARD = {
  HOST: 'https://hiveonboard.com',
  BASE_URL: '/api',
  TICKETS: '/tickets',
};

const NODE_URLS = ['https://rpc.esteem.app', 'https://api.openhive.network', 'https://api.hive.blog', 'https://hive-api.arcange.eu'];

module.exports = {
  NODE_URLS,
  GEO_IP_API,
  telegramApi,
  HIVE_ON_BOARD,
  OBJECT_BOT: OBJECT_BOT[process.env.NODE_ENV || 'development'],
  NOTIFICATIONS_API: NOTIFICATIONS_API[process.env.NODE_ENV || 'development'],
  CURRENCIES_API: CURRENCIES_API[process.env.NODE_ENV || 'development'],
};
