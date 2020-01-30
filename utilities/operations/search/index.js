const moduleExports = {};

moduleExports.wobjects = require('./searchWobjects');
moduleExports.objectTypes = require('./searchTypes');
moduleExports.users = require('./searchUsers');
moduleExports.global = require('./globalSearch');

module.exports = moduleExports;
