module.exports = {
  fillPosts: require('./posts/fillAdditionalInfo/fillPosts'),
  checkFollowers: require('./users/checkFollowers/checkUserFollowers'),
  checkFollowings: require('./users/checkFollowings/checkUserFollowings'),
  moderateObjects: require('./objects/moderation/moderateWobjects'),
  checkObjectFollowings: require('./objects/checkFollowings/checkObjectsFollowings'),
  filterUniqGroupId: require('./objects/uniqueGroupId/filterUniqueGroupId'),
  checkBellNotifications: require('./users/checkBellNotifications/checkBellNotifications'),
};
