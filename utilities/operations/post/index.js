const moduleExports = {};

moduleExports.getPostsByCategory = require('./getPostsByCategory');
moduleExports.getSinglePost = require('./getSinglePost');
moduleExports.getPostComments = require('./getPostComments');
moduleExports.getPostsByQuery = require('./getPostsByQuery');

module.exports = moduleExports;
