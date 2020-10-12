const _ = require('lodash');
const { INACTIVE_STATUSES } = require('constants/sitesConstants');
const { getNamespace } = require('cls-hooked');
const config = require('config');
const { redisStatisticsKey } = require('constants/sitesConstants');
const { redisSetter } = require('utilities/redis');
const { App } = require('models');

exports.saveUserIp = async (req, res, next) => {
  const session = getNamespace('request-session');
  const host = session.get('host');
  const ip = req.headers['x-real-ip'];
  const { result, error } = await App.findOne({ host });
  if (error) return next(error);
  if (!result) return res.redirect(303, `https://${config.appHost}`);

  if (_.includes(INACTIVE_STATUSES, result.status)) {
    const { origin, referer } = req.headers;
    res.req.method = 'GET';
    if (!origin || !referer) return res.redirect(303, `https://${config.appHost}`);

    const { result: parent } = await App.findOne({ _id: result.parent });

    const parentHost = `https://${_.get(parent, 'host', config.appHost)}${referer.replace(origin, '')}`;
    return res.redirect(303, parentHost);
  }
  if (!ip || !result) return next();
  await redisSetter.addSiteActiveUser(`${redisStatisticsKey}:${host}`, ip);
  next();
};
