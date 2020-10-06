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
  },
  staging: {
    HOST: 'https://waiviodev.com',
    BASE_URL: '/objects-bot',
    CREATE_WEBSITE: '/create-site',
    DELETE_WEBSITE: '/delete-site',
  },
  development: {
    HOST: 'http://localhost:8093',
    BASE_URL: '/objects-bot',
    CREATE_WEBSITE: '/create-site',
    DELETE_WEBSITE: '/delete-site',
  },
  test: {
    HOST: 'http://localhost:8093',
    BASE_URL: '/objects-bot',
    CREATE_WEBSITE: '/create-site',
    DELETE_WEBSITE: '/delete-site',
  },
};

module.exports = {
  telegramApi,
  OBJECT_BOT: OBJECT_BOT[process.env.NODE_ENV || 'development'],
};
