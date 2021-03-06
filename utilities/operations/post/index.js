const moduleExports = {};

moduleExports.getPostsByCategory = require('./getPostsByCategory');
moduleExports.getSinglePost = require('./getSinglePost');
moduleExports.getPostComments = require('./getPostComments');
moduleExports.getManyPosts = require('./getManyPosts');
moduleExports.getPostSocialInfo = require('./getPostSocialInfo');

module.exports = moduleExports;
