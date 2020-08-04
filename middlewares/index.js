const moduleExports = {};

moduleExports.checkUserFollowers = require('./users/checkFollowers').checkUserFollowers;
moduleExports.checkUserFollowings = require('./users/checkFollowings').checkUserFollowings;
moduleExports.checkBellNotifications = require('./users/checkBellNotifications').checkBellNotifications;
moduleExports.fillPostAdditionalInfo = require('./posts/fillAdditionalInfo').fillPostAdditionalInfo;
moduleExports.moderateWobjects = require('./wobject/moderation').moderateWobjects;
moduleExports.checkObjectsFollowings = require('./wobject/checkFollowings').checkObjectsFollowings;

module.exports = moduleExports;
