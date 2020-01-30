const moduleExports = {};

moduleExports.getWobjectPostWriters = require('./getWobjectPostWriters');
moduleExports.getFollowingUpdates = require('./getFollowingUpdates');
moduleExports.getFollowingsUser = require('./getFollowingsUser');
moduleExports.getPostFilters = require('./getPostFilters');
moduleExports.updateMetadata = require('./updateMetadata');
moduleExports.objectsShares = require('./objectsShares');
moduleExports.getMetadata = require('./getUserMetadata');
moduleExports.getManyUsers = require('./getManyUsers');
moduleExports.getFollowers = require('./getFollowers');
moduleExports.getUserFeed = require('./getUserFeed');
moduleExports.getComments = require('./getComments');
moduleExports.getOneUser = require('./getOneUser');
moduleExports.getBlog = require('./getBlog');

module.exports = moduleExports;
