const { Router } = require('express');
const {
  WobjController,
  UserController,
  PostController,
  ObjectTypeController,
  AppController,
  ImageController,
  globalSearchController,
  sitesController,
  vipTicketsController,
  hiveController,
  departmentController,
  shopController,
} = require('controllers');

const apiRoutes = new Router();
const wobjRoutes = new Router();
const userRoutes = new Router();
const postRoutes = new Router();
const appRoutes = new Router();
const objectTypeRoutes = new Router();
const sitesRoutes = new Router();
const ticketsRoutes = new Router();
const hiveRoutes = new Router();
const shopRoutes = new Router();

apiRoutes.use('/api', wobjRoutes);
apiRoutes.use('/api', userRoutes);
apiRoutes.use('/api', postRoutes);
apiRoutes.use('/api', appRoutes);
apiRoutes.use('/api', objectTypeRoutes);
apiRoutes.use('/api', sitesRoutes);
apiRoutes.use('/api', ticketsRoutes);
apiRoutes.use('/api/hive', hiveRoutes);
apiRoutes.use('/api/shop', shopRoutes);

// region Sites
sitesRoutes.route('/sites')
  .get(sitesController.getUserApps)
  .post(sitesController.firstLoad)
  .delete(sitesController.delete);
sitesRoutes.route('/sites/parent-host')
  .get(sitesController.getParentHost);
sitesRoutes.route('/sites/info')
  .get(sitesController.info);
sitesRoutes.route('/sites/getParents')
  .get(sitesController.parentList);
sitesRoutes.route('/sites/create')
  .put(sitesController.create);
sitesRoutes.route('/sites/checkAvailable')
  .get(sitesController.availableCheck);
sitesRoutes.route('/sites/check-ns')
  .get(sitesController.checkNs);
sitesRoutes.route('/sites/configuration')
  .get(sitesController.configurationsList)
  .post(sitesController.saveConfigurations);
sitesRoutes.route('/sites/ad-sense')
  .get(sitesController.getAdSense);
sitesRoutes.route('/sites/manage')
  .get(sitesController.managePage);
sitesRoutes.route('/sites/report')
  .get(sitesController.report);
sitesRoutes.route('/sites/refunds')
  .get(sitesController.refundList);
sitesRoutes.route('/sites/administrators')
  .get(sitesController.siteAuthorities);
sitesRoutes.route('/sites/moderators')
  .get(sitesController.siteAuthorities);
sitesRoutes.route('/sites/authorities')
  .get(sitesController.siteAuthorities);
sitesRoutes.route('/sites/filters')
  .get(sitesController.getObjectFilters)
  .post(sitesController.saveObjectFilters);
sitesRoutes.route('/sites/tags')
  .get(sitesController.findTags);
sitesRoutes.route('/sites/map')
  .get(sitesController.getMapCoordinates)
  .post(sitesController.getMapData)
  .put(sitesController.setMapCoordinates);
sitesRoutes.route('/sites/settings')
  .get(sitesController.getSettings);
sitesRoutes.route('/sites/restrictions')
  .get(sitesController.getRestrictions);
sitesRoutes.route('/sites/prefetch')
  .get(sitesController.getPrefetchesList)
  .post(sitesController.createPrefetch)
  .put(sitesController.updatePrefetchesList);
sitesRoutes.route('/sites/all-prefetches')
  .get(sitesController.showAllPrefetches);
sitesRoutes.route('/sites/affiliate')
  .get(sitesController.getAffiliateList)
  .put(sitesController.updateAffiliateList);
// endregion

// region Department
wobjRoutes.route('/departments')
  .post(departmentController.getDepartments);
wobjRoutes.route('/departments/wobjects')
  .post(departmentController.getWobjectsByDepartments);
wobjRoutes.route('/departments/search')
  .post(departmentController.getDepartmentsSearch);
// endregion

// region Shop
shopRoutes.route('/department-feed').post(shopController.getFeedByDepartment);
shopRoutes.route('/main-feed').post(shopController.getFeed);
shopRoutes.route('/departments').post(shopController.getDepartments);
shopRoutes.route('/filters').post(shopController.getFilters);
shopRoutes.route('/filters/tags').post(shopController.getMoreTags);
shopRoutes.route('/state').post(shopController.restoreShopState);

shopRoutes.route('/user/departments').post(shopController.getUserDepartments);
shopRoutes.route('/user/department-feed').post(shopController.getUserFeedByDepartment);
shopRoutes.route('/user/main-feed').post(shopController.getUserFeed);
shopRoutes.route('/user/filters').post(shopController.getUserFilters);
shopRoutes.route('/user/filters/tags').post(shopController.getUserTags);

shopRoutes.route('/wobject/departments').post(shopController.getWobjectDepartments);
shopRoutes.route('/wobject/department-feed').post(shopController.getWobjectDepartmentFeed);
shopRoutes.route('/wobject/main-feed').post(shopController.getWobjectMainFeed);
shopRoutes.route('/wobject/filters').post(shopController.getWobjectFilters);
shopRoutes.route('/wobject/filters/tags').post(shopController.getWobjectTags);

shopRoutes.route('/wobject/reference')
  .post(shopController.getAllReferences);
shopRoutes.route('/wobject/reference/type')
  .post(shopController.getReferencesByType);
shopRoutes.route('/wobject/related')
  .post(shopController.getRelated);
shopRoutes.route('/wobject/similar')
  .post(shopController.getSimilar);
// endregion

// region Wobject
wobjRoutes.route('/wobject')
  .post(WobjController.index);
wobjRoutes.route('/wobject/:authorPermlink/getField')
  .get(WobjController.getWobjectField);
wobjRoutes.route('/wobject/:authorPermlink')
  .get(WobjController.show);
wobjRoutes.route('/wobject/:authorPermlink/posts')
  .post(WobjController.posts);
wobjRoutes.route('/wobject/:authorPermlink/followers')
  .post(WobjController.followers);
wobjRoutes.route('/wobject/:authorPermlink/gallery')
  .get(WobjController.gallery);
wobjRoutes.route('/wobject/:authorPermlink/related')
  .get(WobjController.related);
wobjRoutes.route('/wobject/:authorPermlink/object_expertise')
  .post(WobjController.objectExpertise);
wobjRoutes.route('/wobjectSearch')
  .post(WobjController.search);
wobjRoutes.route('/wobjectsFeed')
  .post(WobjController.feed);
wobjRoutes.route('/wobjectsByField')
  .get(WobjController.getByField);
wobjRoutes.route('/wobject/:authorPermlink/child_wobjects')
  .get(WobjController.getChildWobjects);
wobjRoutes.route('/wobject/:authorPermlink/nearby')
  .get(WobjController.getWobjectsNearby);
wobjRoutes.route('/wobject/count/by-area')
  .get(WobjController.countWobjectsByArea);
wobjRoutes.route('/wobject/:authorPermlink/exist')
  .get(WobjController.checkIfObjectExists);
wobjRoutes.route('/wobject/:authorPermlink/fields')
  .get(WobjController.getWobjectUpdates);
wobjRoutes.route('/wobject/:authorPermlink/newsfeed')
  .post(WobjController.newsfeed);
wobjRoutes.route('/wobject/:authorPermlink/authority-fields')
  .get(WobjController.getAuthorities);

wobjRoutes.route('/wobjects/map/experts')
  .post(WobjController.getMapObjectExperts);
wobjRoutes.route('/wobjects/map/last-post')
  .post(WobjController.getMapObjectLastPost);
wobjRoutes.route('/wobjects/campaign/required-object')
  .post(WobjController.getWobjectsByRequiredObject);

wobjRoutes.route('/wobjects/names')
  .post(WobjController.getWobjectNames);
wobjRoutes.route('/wobjects/options')
  .post(WobjController.getWobjectOptions);
wobjRoutes.route('/wobjects/group-id')
  .post(WobjController.getWobjectsByGroupId);
wobjRoutes.route('/wobjects/list-item-process')
  .post(WobjController.recountList);
wobjRoutes.route('/wobjects/list-item-links')
  .post(WobjController.getListLinks);
wobjRoutes.route('/wobjects/list-item-departments')
  .post(WobjController.getListDepartments);
wobjRoutes.route('/wobjects/search-default')
  .post(WobjController.searchDefault);
// endregion
// region User
userRoutes.route('/users')
  .get(UserController.index);
userRoutes.route('/user/:userName')
  .get(UserController.show);
userRoutes.route('/user/:userName/delegation')
  .get(UserController.showDelegation);
userRoutes.route('/user/getUsersData')
  .post(UserController.usersData);
userRoutes.route('/user/:userName/setState')
  .get(UserController.modalWindowMarker);
userRoutes.route('/user/:userName/following_objects')
  .post(UserController.objectsFollow);
userRoutes.route('/user/:userName/following_users')
  .get(UserController.usersFollow);
userRoutes.route('/user/:userName/followers')
  .get(UserController.followers);
userRoutes.route('/user/:userName/feed')
  .post(UserController.feed);
userRoutes.route('/user/:userName/blog')
  .post(UserController.blog);
userRoutes.route('/user/:userName/blog-tags')
  .post(UserController.blogTags);
userRoutes.route('/user/:userName/comments')
  .get(UserController.getUserComments);
userRoutes.route('/user/:userName/objects_shares')
  .post(UserController.userObjectsShares);
userRoutes.route('/user/:userName/expertise-counters')
  .get(UserController.userObjectsSharesCount);
userRoutes.route('/user/:userName/get_post_filters')
  .get(UserController.postFilters);
userRoutes.route('/users/search')
  .get(UserController.searchUsers);
userRoutes.route('/user/:userName/userMetadata')
  .put(UserController.updateUserMetadata)
  .get(UserController.getUserMetadata);
userRoutes.route('/user/:userName/following_updates')
  .get(UserController.followingUpdates);
userRoutes.route('/user/:userName/following_users_updates')
  .get(UserController.followingUsersUpdates);
userRoutes.route('/user/:userName/following_wobjects_updates')
  .get(UserController.followingWobjectsUpdates);
userRoutes.route('/import_steem_user')
  .get(UserController.importUserFromSteem);
userRoutes.route('/user/:userName/vote-value')
  .get(UserController.getVoteValue);
userRoutes.route('/user/:userName/vote-value-info')
  .get(UserController.getEstimatedVote);
userRoutes.route('/user/:userName/waiv-vote')
  .get(UserController.getWaivVote);
userRoutes.route('/user/:userName/white-list-object')
  .get(UserController.checkObjectWhiteList);
userRoutes.route('/geo-ip')
  .get(UserController.getGeoByIp)
  .put(UserController.putUserGeo);
userRoutes.route('/user/:userName/creation-date')
  .get(UserController.getCreationDate);
userRoutes.route('/user/:userName/last-activity').get(UserController.getLastActivity);
userRoutes.route('/user/advanced-report').post(UserController.getAdvancedReport);
userRoutes.route('/user/:account/guest-wallet').get(UserController.getGuestWallet);
userRoutes.route('/user/:account/guest-balance').get(UserController.getGuestBalance);

userRoutes.route('/user/:userName/draft').post(UserController.createOrUpdatePageDraft);
userRoutes.route('/user/:userName/draft').get(UserController.getOnePageDraft);
userRoutes.route('/user/:userName/comment-draft').post(UserController.createOrUpdateCommentDraft);
userRoutes.route('/user/:userName/comment-draft').get(UserController.getOneCommentDraft);

userRoutes.route('/user/:userName/affiliate').post(UserController.getAffiliate);
userRoutes.route('/users/guest-wallet/hive-withdraw').post(UserController.guestWithdrawHive);
userRoutes.route('/users/guest-wallet/hive-withdraw-estimates').post(UserController.guestWithdrawHiveEstimates);
userRoutes.route('/users/guest-wallet/hive-withdraw-range').post(UserController.guestWithdrawHiveRange);
userRoutes.route('/users/min-reject').post(UserController.getMinReject);
// endregion
// region Draft

// Deprecated. Used for subscribe button for users who liked the post
// userRoutes.route('/user/:userName/getFollowingsState')
//   .get(UserController.followingsState);
// endregion
// region Post
postRoutes.route('/post/:author/:permlink')
  .get(PostController.show);
postRoutes.route('/post/like-post')
  .post(PostController.likePost);
postRoutes.route('/posts/getMany')
  .post(PostController.getManyPosts);
postRoutes.route('/posts/preview-cache')
  .post(PostController.getPreviewLinks)
  .put(PostController.putPreviewUrl);
postRoutes.route('/posts')
  .post(PostController.getByCategory);
postRoutes.route('/post_comments')
  .get(PostController.getPostComments);
postRoutes.route('/post/social-info')
  .get(PostController.getSocialInfo);
// endregion
// region App
appRoutes.route('/app/:appName')
  .get(AppController.show);
appRoutes.route('/app/:appName/experts')
  .get(AppController.experts);
appRoutes.route('/app/:name/hashtags')
  .get(AppController.hashtags);
appRoutes.route('/image')
  .post(ImageController.saveImage);
// endregion
// region ObjectType
objectTypeRoutes.route('/objectTypes')
  .post(ObjectTypeController.index);
objectTypeRoutes.route('/objectTypesSearch')
  .post(ObjectTypeController.search);
objectTypeRoutes.route('/objectType/:objectTypeName')
  .post(ObjectTypeController.show);
objectTypeRoutes.route('/objectType/:objectTypeName/expertise')
  .get(ObjectTypeController.expertise);
objectTypeRoutes.route('/objectType/showMoreTags')
  .get(ObjectTypeController.showMoreTags);
objectTypeRoutes.route('/objectTypes/tags-for-filter')
  .post(ObjectTypeController.tagsForFilter);
// endregion
// region Search
userRoutes.route('/generalSearch')
  .post(globalSearchController.globalSearch);
// endregion
// region Vip-tickets
ticketsRoutes.route('/vip-tickets')
  .get(vipTicketsController.getVipTickets)
  .patch(vipTicketsController.addTicketNote);
// endregion
// region Hive Routes
hiveRoutes.route('/reward-fund')
  .get(hiveController.getRewardFund);
hiveRoutes.route('/current-median-history')
  .get(hiveController.getCurrentMedianHistory);
hiveRoutes.route('/block-num')
  .get(hiveController.getBlockNum);
// endregion

module.exports = apiRoutes;
