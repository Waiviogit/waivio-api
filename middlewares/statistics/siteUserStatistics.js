const { redisStatisticsKey } = require('constants/sitesConstants');
const {
  URL, REDIS_KEYS, TTL_TIME,
} = require('constants/common');
const { isbot } = require('isbot');
const { getNamespace } = require('cls-hooked');
const config = require('config');
const { redisSetter } = require('utilities/redis');
const { App } = require('models');
const { REPLACE_HOST_WITH_PARENT } = require('constants/regExp');
const { getIpFromHeaders } = require('utilities/helpers/sitesHelper');
const { checkForSocialSite } = require('../../utilities/helpers/sitesHelper');
const { getCurrentDateString } = require('../../utilities/helpers/dateHelper');

const setSiteActiveUser = async ({ userAgent, host, ip }) => {
  const bot = isbot(userAgent);
  const key = `${REDIS_KEYS.API_VISIT_STATISTIC}:${getCurrentDateString()}:${host}:${bot ? 'bot' : 'user'}`;

  await redisSetter.zincrbyExpire({
    key, ttl: TTL_TIME.THIRTY_DAYS, member: ip, increment: 1,
  });

  if (bot) return;

  await redisSetter.addSiteActiveUser(`${redisStatisticsKey}:${host}`, ip);
};

exports.saveUserIp = async (req, res, next) => {
  const session = getNamespace('request-session');
  const host = session.get('host');
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
  await setSiteActiveUser({ host, ip, userAgent: req.get('User-Agent') });
  next();
};
