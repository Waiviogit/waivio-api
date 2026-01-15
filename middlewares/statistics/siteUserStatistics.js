const { isbot } = require('isbot');
const {
  URL, REDIS_KEYS, TTL_TIME,
} = require('../../constants/common');
const config = require('../../config');
const { App } = require('../../models');
const { REPLACE_HOST_WITH_PARENT } = require('../../constants/regExp');
const { getIpFromHeaders } = require('../../utilities/helpers/sitesHelper');
const { checkForSocialSite } = require('../../utilities/helpers/sitesHelper');
const { REPLACE_ORIGIN } = require('../../constants/regExp');
const asyncLocalStorage = require('../context/context');
const { setSiteActiveUser } = require('../../utilities/operations/sites/sitesStatistic');
const { getCurrentDateString } = require('../../utilities/helpers/dateHelper');
const { redisSetter, redis } = require('../../utilities/redis');

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

exports.saveExportHoneypotIp = async (req, res, next) => {
  const ip = getIpFromHeaders(req);
  if (!ip) return next();

  const userAgent = req.get('User-Agent');
  const bot = isbot(userAgent);
  const date = getCurrentDateString();
  const key = bot
    ? `${REDIS_KEYS.EXPORT_HONEYPOT_BOTS}:${date}`
    : `${REDIS_KEYS.EXPORT_HONEYPOT_USERS}:${date}`;

  await redisSetter.addSiteActiveUser(key, ip);
  await redisSetter.expire({ key, ttl: TTL_TIME.THIRTY_DAYS, client: redis.appUsersStatistics });
  next();
};
