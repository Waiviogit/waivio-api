const asyncLocalStorage = require('./context');
const { REPLACE_ORIGIN, REPLACE_REFERER } = require('../../constants/regExp');
const config = require('../../config');

const contextMiddleware = (req, res, next) => {
  try {
    asyncLocalStorage.run(new Map(), () => {
      const store = asyncLocalStorage.getStore();

      let appHost;
      const { origin, referer, device } = req.headers;
      appHost = origin
        ? origin.replace(REPLACE_ORIGIN, '')
        : referer && referer.replace(REPLACE_REFERER, '');

      // for requests from SSR
      const serverHost = req.headers['app-host'];
      if (serverHost) {
        appHost = serverHost.replace(REPLACE_ORIGIN, '');
      }

      store.set('requestId', req.headers['x-request-id']);
      store.set('host', appHost || config.appHost);
      store.set('access-token', req.headers['access-token']);
      store.set('hive-auth', req.headers['hive-auth'] === 'true');
      store.set('waivio-auth', req.headers['waivio-auth'] === 'true');
      store.set('device', device);

      res.on('finish', () => {
        res.result = null;
        store.clear();
      });

      next();
    });
  } catch (error) {
    next(error); // Pass any errors to the error handling middleware
  }
};

module.exports = contextMiddleware;
