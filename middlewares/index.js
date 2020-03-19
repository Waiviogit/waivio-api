const moduleExports = {};

moduleExports.moderateUsers = require('./users/moderation').moderateUsers;
moduleExports.fillPostAdditionalInfo = require('./posts/fillAdditionalInfo').fillPostAdditionalInfo;
moduleExports.moderateWobjects = require('./wobject/moderation').moderateWobjects;

module.exports = moduleExports;
