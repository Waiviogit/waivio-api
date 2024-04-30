const { Router } = require('express');
const { UserController, draftController } = require('controllers');
const { reqTimeMonitor } = require('../middlewares/statistics/reqRates');

const userRoutes = new Router();

userRoutes.route('/users')
  .get(reqTimeMonitor, UserController.index);
userRoutes.route('/user/:userName')
  .get(reqTimeMonitor, UserController.show);
userRoutes.route('/user/:userName/hive-exist')
  .get(reqTimeMonitor, UserController.hiveUserExist);
userRoutes.route('/user/:userName/delegation')
  .get(reqTimeMonitor, UserController.showDelegation);
userRoutes.route('/user/getUsersData')
  .post(reqTimeMonitor, UserController.usersData);
userRoutes.route('/user/:userName/setState')
  .get(reqTimeMonitor, UserController.modalWindowMarker);
userRoutes.route('/user/:userName/following_objects')
  .post(reqTimeMonitor, UserController.objectsFollow);
userRoutes.route('/user/:userName/following_users')
  .get(reqTimeMonitor, UserController.usersFollow);
userRoutes.route('/user/:userName/followers')
  .get(reqTimeMonitor, UserController.followers);
userRoutes.route('/user/:userName/feed')
  .post(reqTimeMonitor, UserController.feed);
userRoutes.route('/user/:userName/blog')
  .post(reqTimeMonitor, UserController.blog);
userRoutes.route('/user/:userName/blog-tags')
  .post(reqTimeMonitor, UserController.blogTags);
userRoutes.route('/user/:userName/comments')
  .get(reqTimeMonitor, UserController.getUserComments);
userRoutes.route('/user/:userName/objects_shares')
  .post(reqTimeMonitor, UserController.userObjectsShares);
userRoutes.route('/user/:userName/expertise-counters')
  .get(reqTimeMonitor, UserController.userObjectsSharesCount);
userRoutes.route('/user/:userName/get_post_filters')
  .get(reqTimeMonitor, UserController.postFilters);
userRoutes.route('/user/:userName/favorites').post(reqTimeMonitor, UserController.getFavorites);
userRoutes.route('/user/:userName/favorites/list').get(reqTimeMonitor, UserController.getFavoritesList);

userRoutes.route('/users/search')
  .get(reqTimeMonitor, UserController.searchUsers);
userRoutes.route('/user/:userName/userMetadata')
  .put(reqTimeMonitor, UserController.updateUserMetadata)
  .get(reqTimeMonitor, UserController.getUserMetadata);
userRoutes.route('/user/:userName/following_updates')
  .get(reqTimeMonitor, UserController.followingUpdates);
userRoutes.route('/user/:userName/following_users_updates')
  .get(reqTimeMonitor, UserController.followingUsersUpdates);
userRoutes.route('/user/:userName/following_wobjects_updates')
  .get(reqTimeMonitor, UserController.followingWobjectsUpdates);
userRoutes.route('/import_steem_user')
  .get(reqTimeMonitor, UserController.importUserFromSteem);
userRoutes.route('/user/:userName/vote-value')
  .get(reqTimeMonitor, UserController.getVoteValue);
userRoutes.route('/user/:userName/vote-value-info')
  .get(reqTimeMonitor, UserController.getEstimatedVote);
userRoutes.route('/user/:userName/waiv-vote')
  .get(reqTimeMonitor, UserController.getWaivVote);
userRoutes.route('/user/:userName/white-list-object')
  .get(reqTimeMonitor, UserController.checkObjectWhiteList);
userRoutes.route('/geo-ip')
  .get(reqTimeMonitor, UserController.getGeoByIp)
  .put(reqTimeMonitor, UserController.putUserGeo);
userRoutes.route('/user/:userName/creation-date')
  .get(reqTimeMonitor, UserController.getCreationDate);
userRoutes.route('/user/:userName/last-activity').get(reqTimeMonitor, UserController.getLastActivity);
userRoutes.route('/user/advanced-report').post(reqTimeMonitor, UserController.getAdvancedReport);

userRoutes.route('/user/advanced-report/generated').post(reqTimeMonitor, UserController.generateAdvancedReport);

userRoutes.route('/user/:account/guest-wallet').get(reqTimeMonitor, UserController.getGuestWallet);
userRoutes.route('/user/:account/guest-balance').get(reqTimeMonitor, UserController.getGuestBalance);
userRoutes.route('/user/:account/guest-mana').get(reqTimeMonitor, UserController.getGuestMana);
// todo remove
userRoutes.route('/user/:userName/draft').post(reqTimeMonitor, draftController.createOrUpdatePageDraft);
userRoutes.route('/user/:userName/draft').get(reqTimeMonitor, draftController.getOnePageDraft);

userRoutes.route('/user/:userName/affiliate').post(reqTimeMonitor, UserController.getAffiliate);
userRoutes.route('/users/guest-wallet/hive-withdraw').post(reqTimeMonitor, UserController.guestWithdrawHive);
userRoutes.route('/users/guest-wallet/hive-withdraw-estimates').post(reqTimeMonitor, UserController.guestWithdrawHiveEstimates);
userRoutes.route('/users/guest-wallet/hive-withdraw-range').post(reqTimeMonitor, UserController.guestWithdrawHiveRange);
userRoutes.route('/users/min-reject').post(reqTimeMonitor, UserController.getMinReject);
userRoutes.route('/users/avatar').post(reqTimeMonitor, UserController.getAvatars);

module.exports = userRoutes;
