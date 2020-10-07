const _ = require('lodash');
const { STATUSES } = require('constants/sitesConstants');
const { getNamespace } = require('cls-hooked');
const config = require('config');
const { redisStatisticsKey } = require('constants/sitesConstants');
const { redisSetter } = require('utilities/redis');
const { App } = require('models');

exports.saveUserIp = async (req, res, next) => {
  const session = getNamespace('request-session');
  const host = session.get('host');
  const ip = req.headers['x-real-ip'];
  const { result } = await App.findOne({ host });
  if (!ip || !result) return next();

  if (result.status === STATUSES.SUSPENDED) {
    const { origin, referer } = req.headers;
    if (!origin || !referer) return res.redirect(307, `https://${config.appHost}`);
    const { result: parent } = await App.findOne({ _id: result.parent });

    const parentHost = `https://${_.get(parent, 'host', config.appHost)}${referer.replace(origin, '')}`;
    return res.redirect(307, parentHost);
  }

  await redisSetter.addSiteActiveUser(`${redisStatisticsKey}:${host}`, ip);
  next();
};
