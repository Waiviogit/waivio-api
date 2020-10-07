const { STATUSES } = require('constants/sitesConstants');
const { getNamespace } = require('cls-hooked');
const { redisStatisticsKey } = require('constants/sitesConstants');
const { redisSetter } = require('utilities/redis');
const { App } = require('models');

exports.saveUserIp = async (req, res, next) => {
  const session = getNamespace('request-session');
  const host = session.get('host');
  const ip = req.headers['x-real-ip'];
  const { result } = await App.findOne({ host });
  if (!ip || !result || result.status === STATUSES.SUSPENDED) return next();
  await redisSetter.addSiteActiveUser(`${redisStatisticsKey}:${host}`, ip);
  next();
};
