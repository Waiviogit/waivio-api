const fillPosts = require('./posts/fillAdditionalInfo/fillPosts');
const checkFollowers = require('./users/checkFollowers/checkUserFollowers');
const checkFollowings = require('./users/checkFollowings/checkUserFollowings');
const moderateObjects = require('./objects/moderation/moderateWobjects');
const checkObjectFollowings = require('./objects/checkFollowings/checkObjectsFollowings');
const filterUniqGroupId = require('./objects/uniqueGroupId/filterUniqueGroupId');
const checkBellNotifications = require('./users/checkBellNotifications/checkBellNotifications');

module.exports = {
  fillPosts,
  checkFollowers,
  checkFollowings,
  moderateObjects,
  checkObjectFollowings,
  filterUniqGroupId,
  checkBellNotifications,
};
