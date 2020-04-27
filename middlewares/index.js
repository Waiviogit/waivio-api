const moduleExports = {};

moduleExports.checkUserFollowers = require('./users/checkFollowers').checkUserFollowers;
moduleExports.checkUserFollowings = require('./users/checkFollowings').checkUserFollowings;
moduleExports.fillPostAdditionalInfo = require('./posts/fillAdditionalInfo').fillPostAdditionalInfo;
moduleExports.moderateWobjects = require('./wobject/moderation').moderateWobjects;
moduleExports.checkObjectsFollowings = require('./wobject/checkFollowings').checkObjectsFollowings;

module.exports = moduleExports;
