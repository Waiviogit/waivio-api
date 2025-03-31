const {
  URL,
} = require('../../constants/common');
const config = require('../../config');
const { App } = require('../../models');
const { REPLACE_HOST_WITH_PARENT } = require('../../constants/regExp');
const { getIpFromHeaders } = require('../../utilities/helpers/sitesHelper');
const { checkForSocialSite } = require('../../utilities/helpers/sitesHelper');
const { REPLACE_ORIGIN } = require('../../constants/regExp');
const asyncLocalStorage = require('../context/context');
const { setSiteActiveUser } = require('../../utilities/operations/sites/sitesStatistic');

const getHost = (req) => {
  const store = asyncLocalStorage.getStore();
  const originalHost = store.get('host');

  let accessHost = req.headers['access-host'];
  if (accessHost) {
    accessHost = accessHost.replace(REPLACE_ORIGIN, '');
    store.set('host', accessHost);
    return { originalHost, host: accessHost };
  }

  return { originalHost, host: originalHost };
};

exports.saveUserIp = async (req, res, next) => {
  const { host, originalHost } = getHost(req);
  const ip = getIpFromHeaders(req);

  const result = await App.getAppFromCache(host);

  if (!result) {
    if (!host) {
      req.pathToRedirect = `${URL.HTTPS}${config.appHost}`;
      return next();
    }
    const path = host.replace(REPLACE_HOST_WITH_PARENT, '');

    req.pathToRedirect = checkForSocialSite(path)
      ? `${URL.HTTPS}${path}`
      : `${URL.HTTPS}${path}/rewards/global`;

    return next();
  }
  req.appData = result;
  if (!ip) return next();
  await setSiteActiveUser({ host: originalHost, ip, userAgent: req.get('User-Agent') });
  next();
};
