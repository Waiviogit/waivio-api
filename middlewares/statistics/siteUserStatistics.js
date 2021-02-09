const _ = require('lodash');
const { INACTIVE_STATUSES, redisStatisticsKey } = require('constants/sitesConstants');
const {
  RESPONSE_STATUS, ERROR_MESSAGE, REQ_METHOD, URL,
} = require('constants/common');
const { getNamespace } = require('cls-hooked');
const config = require('config');
const { redisSetter } = require('utilities/redis');
const { App } = require('models');
const { REPLACE_HOST_WITH_PARENT } = require('constants/regExp');

exports.saveUserIp = async (req, res, next) => {
  const session = getNamespace('request-session');
  const host = session.get('host');
  const ip = req.headers['x-real-ip'];
  const { result, error } = await App.findOne({ host });
  if (error) return next(error);
  if (!result) {
    if (!host) {
      req.pathToRedirect = `${URL.HTTPS}${config.appHost}`;
      return next();
    }
    const path = host.replace(REPLACE_HOST_WITH_PARENT, '');
    req.pathToRedirect = `${URL.HTTPS}${path}/rewards/all`;
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
  await redisSetter.addSiteActiveUser(`${redisStatisticsKey}:${host}`, ip);
  next();
};
