const moduleExports = {};

moduleExports.checkUserFollowers = require('./users/checkFollowers').checkUserFollowers;
moduleExports.fillPostAdditionalInfo = require('./posts/fillAdditionalInfo').fillPostAdditionalInfo;
moduleExports.moderateWobjects = require('./wobject/moderation').moderateWobjects;

module.exports = moduleExports;
