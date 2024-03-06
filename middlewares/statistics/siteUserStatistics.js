const _ = require('lodash');
const { INACTIVE_STATUSES, redisStatisticsKey } = require('constants/sitesConstants');
const {
  RESPONSE_STATUS, ERROR_MESSAGE, REQ_METHOD, URL, REDIS_KEYS, TTL_TIME,
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

  if (_.includes(INACTIVE_STATUSES, result.status)) {
    const { origin, referer } = req.headers;
    const { result: parent } = await App.findOne({ _id: result.parent });
    if (req.method !== REQ_METHOD.POST || req.url !== `${URL.API}${URL.SITES}`) {
      return res
        .status(RESPONSE_STATUS.FORBIDDEN)
        .send({ message: ERROR_MESSAGE.WEBSITE_UNAVAILABLE });
    }
    req.pathToRedirect = `${URL.HTTPS}${_.get(parent, 'host', config.appHost)}${referer.replace(origin, '')}`;
    return next();
  }

  if (!ip) return next();
  await setSiteActiveUser({ host, ip, userAgent: req.get('User-Agent') });
  next();
};
