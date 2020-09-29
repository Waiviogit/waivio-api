const { redisStatisticsKey } = require('constants/sitesConstants');
const { redisSetter } = require('utilities/redis');

exports.saveUserIp = async (req, res, next) => {
  const { host } = req.headers;
  const ip = req.headers['x-real-ip'];
  if (!ip) return next();
  await redisSetter.addSiteActiveUser(`${redisStatisticsKey}:${host}`, ip);
  next();
};
