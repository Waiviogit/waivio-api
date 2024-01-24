const moduleExports = {};

moduleExports.checkUserFollowers = require('./users/checkFollowers').checkUserFollowers;
moduleExports.checkUserFollowings = require('./users/checkFollowings').checkUserFollowings;
moduleExports.checkBellNotifications = require('./users/checkBellNotifications').checkBellNotifications;
moduleExports.fillPostAdditionalInfo = require('./posts/fillAdditionalInfo').fillPostAdditionalInfo;
moduleExports.moderateWobjects = require('./wobject/moderation').moderateWobjects;
moduleExports.filterUniqGroupId = require('./wobject/uniqueGroupId/filterUniqueGroupId').filterUniqGroupId;
moduleExports.checkObjectsFollowings = require('./wobject/checkFollowings').checkObjectsFollowings;
moduleExports.siteUserStatistics = require('./statistics/siteUserStatistics');
moduleExports.reqRates = require('./statistics/reqRates');
moduleExports.botRateLimit = require('./rate-limit/botRateLimit');

module.exports = moduleExports;
