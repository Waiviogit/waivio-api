const moduleExports = {};

moduleExports.redis = require('./redis');
moduleExports.redisSetter = require('./redisSetter');
moduleExports.redisGetter = require('./redisGetter');

module.exports = moduleExports;
