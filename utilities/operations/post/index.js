const moduleExports = {};

moduleExports.getPostsByCategory = require('./getPostsByCategory');
moduleExports.getSinglePost = require('./getSinglePost');
moduleExports.getPostComments = require('./getPostComments');
moduleExports.likePost = require('./likePost');
moduleExports.getManyPosts = require('./getManyPosts');
moduleExports.getPostSocialInfo = require('./getPostSocialInfo');
moduleExports.cachePreview = require('./cachePreview');
moduleExports.getPostsByMention = require('./getPostsByMention');

module.exports = moduleExports;
