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
  draftController,
} = require('controllers');
const { reqTimeMonitor } = require('../middlewares/statistics/reqRates');

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
const draftRotes = new Router();

apiRoutes.use('/api', wobjRoutes);
apiRoutes.use('/api', userRoutes);
apiRoutes.use('/api', postRoutes);
apiRoutes.use('/api', appRoutes);
apiRoutes.use('/api', objectTypeRoutes);
apiRoutes.use('/api', sitesRoutes);
apiRoutes.use('/api', ticketsRoutes);
apiRoutes.use('/api/hive', hiveRoutes);
apiRoutes.use('/api/shop', shopRoutes);
apiRoutes.use('/api/draft', draftRotes);

// region Sites
sitesRoutes.route('/sites')
  .get(reqTimeMonitor, sitesController.getUserApps)
  .post(reqTimeMonitor, sitesController.firstLoad)
  .delete(reqTimeMonitor, sitesController.delete);
sitesRoutes.route('/sites/parent-host')
  .get(reqTimeMonitor, sitesController.getParentHost);
sitesRoutes.route('/sites/info')
  .get(reqTimeMonitor, sitesController.info);
sitesRoutes.route('/sites/getParents')
  .get(reqTimeMonitor, sitesController.parentList);
sitesRoutes.route('/sites/create')
  .put(reqTimeMonitor, sitesController.create);
sitesRoutes.route('/sites/checkAvailable')
  .get(reqTimeMonitor, sitesController.availableCheck);
sitesRoutes.route('/sites/check-ns')
  .get(reqTimeMonitor, sitesController.checkNs);
sitesRoutes.route('/sites/configuration')
  .get(reqTimeMonitor, sitesController.configurationsList)
  .post(reqTimeMonitor, sitesController.saveConfigurations);
sitesRoutes.route('/sites/ad-sense')
  .get(reqTimeMonitor, sitesController.getAdSense);
sitesRoutes.route('/sites/manage')
  .get(reqTimeMonitor, sitesController.managePage);
sitesRoutes.route('/sites/report')
  .get(reqTimeMonitor, sitesController.report);
sitesRoutes.route('/sites/refunds')
  .get(reqTimeMonitor, sitesController.refundList);
sitesRoutes.route('/sites/administrators')
  .get(reqTimeMonitor, sitesController.siteAuthorities);
sitesRoutes.route('/sites/moderators')
  .get(reqTimeMonitor, sitesController.siteAuthorities);
sitesRoutes.route('/sites/authorities')
  .get(reqTimeMonitor, sitesController.siteAuthorities);
sitesRoutes.route('/sites/filters')
  .get(reqTimeMonitor, sitesController.getObjectFilters)
  .post(reqTimeMonitor, sitesController.saveObjectFilters);
sitesRoutes.route('/sites/tags')
  .get(reqTimeMonitor, sitesController.findTags);
sitesRoutes.route('/sites/map')
  .get(reqTimeMonitor, sitesController.getMapCoordinates)
  .post(reqTimeMonitor, sitesController.getMapData)
  .put(reqTimeMonitor, sitesController.setMapCoordinates);
sitesRoutes.route('/sites/settings')
  .get(reqTimeMonitor, sitesController.getSettings);
sitesRoutes.route('/sites/restrictions')
  .get(reqTimeMonitor, sitesController.getRestrictions);
sitesRoutes.route('/sites/prefetch')
  .get(reqTimeMonitor, sitesController.getPrefetchesList)
  .post(reqTimeMonitor, sitesController.createPrefetch)
  .put(reqTimeMonitor, sitesController.updatePrefetchesList);
sitesRoutes.route('/sites/all-prefetches')
  .get(reqTimeMonitor, sitesController.showAllPrefetches);
sitesRoutes.route('/sites/affiliate')
  .get(reqTimeMonitor, sitesController.getAffiliateList)
  .put(reqTimeMonitor, sitesController.updateAffiliateList);
// endregion

// region Department
wobjRoutes.route('/departments')
  .post(reqTimeMonitor, departmentController.getDepartments);
wobjRoutes.route('/departments/wobjects')
  .post(reqTimeMonitor, departmentController.getWobjectsByDepartments);
wobjRoutes.route('/departments/search')
  .post(reqTimeMonitor, departmentController.getDepartmentsSearch);
// endregion

// region Shop
shopRoutes.route('/department-feed').post(reqTimeMonitor, shopController.getFeedByDepartment);
shopRoutes.route('/main-feed').post(reqTimeMonitor, shopController.getFeed);
shopRoutes.route('/departments').post(reqTimeMonitor, shopController.getDepartments);
shopRoutes.route('/filters').post(reqTimeMonitor, shopController.getFilters);
shopRoutes.route('/filters/tags').post(reqTimeMonitor, shopController.getMoreTags);
shopRoutes.route('/state').post(reqTimeMonitor, shopController.restoreShopState);

shopRoutes.route('/user/departments').post(reqTimeMonitor, shopController.getUserDepartments);
shopRoutes.route('/user/department-feed').post(reqTimeMonitor, shopController.getUserFeedByDepartment);
shopRoutes.route('/user/main-feed').post(reqTimeMonitor, shopController.getUserFeed);
shopRoutes.route('/user/filters').post(reqTimeMonitor, shopController.getUserFilters);
shopRoutes.route('/user/filters/tags').post(reqTimeMonitor, shopController.getUserTags);

shopRoutes.route('/wobject/departments').post(reqTimeMonitor, shopController.getWobjectDepartments);
shopRoutes.route('/wobject/department-feed').post(reqTimeMonitor, shopController.getWobjectDepartmentFeed);
shopRoutes.route('/wobject/main-feed').post(reqTimeMonitor, shopController.getWobjectMainFeed);
shopRoutes.route('/wobject/filters').post(reqTimeMonitor, shopController.getWobjectFilters);
shopRoutes.route('/wobject/filters/tags').post(reqTimeMonitor, shopController.getWobjectTags);

shopRoutes.route('/wobject/reference')
  .post(reqTimeMonitor, shopController.getAllReferences);
shopRoutes.route('/wobject/reference/type')
  .post(reqTimeMonitor, shopController.getReferencesByType);
shopRoutes.route('/wobject/related')
  .post(reqTimeMonitor, shopController.getRelated);
shopRoutes.route('/wobject/similar')
  .post(reqTimeMonitor, shopController.getSimilar);
// endregion

// region Wobject
wobjRoutes.route('/wobject')
  .post(reqTimeMonitor, WobjController.index);
wobjRoutes.route('/wobject/:authorPermlink/getField')
  .get(reqTimeMonitor, WobjController.getWobjectField);
wobjRoutes.route('/wobject/:authorPermlink')
  .get(reqTimeMonitor, WobjController.show);
wobjRoutes.route('/wobject/:authorPermlink/posts')
  .post(reqTimeMonitor, WobjController.posts);
wobjRoutes.route('/wobject/:authorPermlink/followers')
  .post(reqTimeMonitor, WobjController.followers);
wobjRoutes.route('/wobject/:authorPermlink/gallery')
  .get(reqTimeMonitor, WobjController.gallery);
wobjRoutes.route('/wobject/:authorPermlink/related')
  .get(reqTimeMonitor, WobjController.related);
wobjRoutes.route('/wobject/:authorPermlink/object_expertise')
  .post(reqTimeMonitor, WobjController.objectExpertise);
wobjRoutes.route('/wobjectSearch')
  .post(reqTimeMonitor, WobjController.search);
wobjRoutes.route('/wobjectsFeed')
  .post(reqTimeMonitor, WobjController.feed);
wobjRoutes.route('/wobjectsByField')
  .get(reqTimeMonitor, WobjController.getByField);
wobjRoutes.route('/wobject/:authorPermlink/child_wobjects')
  .get(reqTimeMonitor, WobjController.getChildWobjects);
wobjRoutes.route('/wobject/:authorPermlink/nearby')
  .get(reqTimeMonitor, WobjController.getWobjectsNearby);
wobjRoutes.route('/wobject/count/by-area')
  .get(reqTimeMonitor, WobjController.countWobjectsByArea);
wobjRoutes.route('/wobject/:authorPermlink/exist')
  .get(reqTimeMonitor, WobjController.checkIfObjectExists);
wobjRoutes.route('/wobject/:authorPermlink/fields')
  .get(reqTimeMonitor, WobjController.getWobjectUpdates);
wobjRoutes.route('/wobject/:authorPermlink/newsfeed')
  .post(reqTimeMonitor, WobjController.newsfeed);
wobjRoutes.route('/wobject/:authorPermlink/authority-fields')
  .get(reqTimeMonitor, WobjController.getAuthorities);
wobjRoutes.route('/wobject/:authorPermlink/list-item-locales/:itemLink')
  .get(reqTimeMonitor, WobjController.getListItemsLocales);

wobjRoutes.route('/wobjects/map/experts')
  .post(reqTimeMonitor, WobjController.getMapObjectExperts);
wobjRoutes.route('/wobjects/map/last-post')
  .post(reqTimeMonitor, WobjController.getMapObjectLastPost);
wobjRoutes.route('/wobjects/campaign/required-object')
  .post(reqTimeMonitor, WobjController.getWobjectsByRequiredObject);

wobjRoutes.route('/wobjects/names')
  .post(reqTimeMonitor, WobjController.getWobjectNames);
wobjRoutes.route('/wobjects/options')
  .post(reqTimeMonitor, WobjController.getWobjectOptions);
wobjRoutes.route('/wobjects/group-id')
  .post(reqTimeMonitor, WobjController.getWobjectsByGroupId);
wobjRoutes.route('/wobjects/list-item-process')
  .post(reqTimeMonitor, WobjController.recountList);
wobjRoutes.route('/wobjects/list-item-links')
  .post(reqTimeMonitor, WobjController.getListLinks);
wobjRoutes.route('/wobjects/list-item-departments')
  .post(reqTimeMonitor, WobjController.getListDepartments);
wobjRoutes.route('/wobjects/search-default')
  .post(reqTimeMonitor, WobjController.searchDefault);
// endregion
// region User
userRoutes.route('/users')
  .get(reqTimeMonitor, UserController.index);
userRoutes.route('/user/:userName')
  .get(reqTimeMonitor, UserController.show);
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
userRoutes.route('/user/:account/guest-wallet').get(reqTimeMonitor, UserController.getGuestWallet);
userRoutes.route('/user/:account/guest-balance').get(reqTimeMonitor, UserController.getGuestBalance);
// todo remove
userRoutes.route('/user/:userName/draft').post(reqTimeMonitor, draftController.createOrUpdatePageDraft);
userRoutes.route('/user/:userName/draft').get(reqTimeMonitor, draftController.getOnePageDraft);

userRoutes.route('/user/:userName/affiliate').post(reqTimeMonitor, UserController.getAffiliate);
userRoutes.route('/users/guest-wallet/hive-withdraw').post(reqTimeMonitor, UserController.guestWithdrawHive);
userRoutes.route('/users/guest-wallet/hive-withdraw-estimates').post(reqTimeMonitor, UserController.guestWithdrawHiveEstimates);
userRoutes.route('/users/guest-wallet/hive-withdraw-range').post(reqTimeMonitor, UserController.guestWithdrawHiveRange);
userRoutes.route('/users/min-reject').post(reqTimeMonitor, UserController.getMinReject);
// endregion
// region Draft
draftRotes.route('/post')
  .post(reqTimeMonitor, draftController.createOrUpdatePostDraft)
  .get(reqTimeMonitor, draftController.getOnePostDraft)
  .delete(reqTimeMonitor, draftController.deleteOnePostDraft);
draftRotes.route('/posts')
  .get(reqTimeMonitor, draftController.getPostDrafts);
draftRotes.route('/object')
  .post(reqTimeMonitor, draftController.createOrUpdatePageDraft)
  .get(reqTimeMonitor, draftController.getOnePageDraft);
draftRotes.route('/comment')
  .post(reqTimeMonitor, draftController.createOrUpdateCommentDraft)
  .get(reqTimeMonitor, draftController.getOneCommentDraft);
// endregion
// region Post
postRoutes.route('/post/:author/:permlink')
  .get(reqTimeMonitor, PostController.show);
postRoutes.route('/post/like-post')
  .post(reqTimeMonitor, PostController.likePost);
postRoutes.route('/posts/getMany')
  .post(reqTimeMonitor, PostController.getManyPosts);
postRoutes.route('/posts/preview-cache')
  .post(reqTimeMonitor, PostController.getPreviewLinks)
  .put(reqTimeMonitor, PostController.putPreviewUrl);
postRoutes.route('/posts')
  .post(reqTimeMonitor, PostController.getByCategory);
postRoutes.route('/post_comments')
  .get(reqTimeMonitor, PostController.getPostComments);
postRoutes.route('/post/social-info')
  .get(reqTimeMonitor, PostController.getSocialInfo);
// endregion
// region App
appRoutes.route('/app/:appName')
  .get(reqTimeMonitor, AppController.show);
appRoutes.route('/app/:appName/experts')
  .get(reqTimeMonitor, AppController.experts);
appRoutes.route('/app/:name/hashtags')
  .get(reqTimeMonitor, AppController.hashtags);
appRoutes.route('/image')
  .post(reqTimeMonitor, ImageController.saveImage);
appRoutes.route('/req-rates')
  .get(reqTimeMonitor, AppController.getReqRates);
// endregion
// region ObjectType
objectTypeRoutes.route('/objectTypes')
  .post(reqTimeMonitor, ObjectTypeController.index);
objectTypeRoutes.route('/objectTypesSearch')
  .post(reqTimeMonitor, ObjectTypeController.search);
objectTypeRoutes.route('/objectType/:objectTypeName')
  .post(reqTimeMonitor, ObjectTypeController.show);
objectTypeRoutes.route('/objectType/:objectTypeName/expertise')
  .get(reqTimeMonitor, ObjectTypeController.expertise);
objectTypeRoutes.route('/objectType/showMoreTags')
  .get(reqTimeMonitor, ObjectTypeController.showMoreTags);
objectTypeRoutes.route('/objectTypes/tags-for-filter')
  .post(reqTimeMonitor, ObjectTypeController.tagsForFilter);
// endregion
// region Search
userRoutes.route('/generalSearch')
  .post(reqTimeMonitor, globalSearchController.globalSearch);
// endregion
// region Vip-tickets
ticketsRoutes.route('/vip-tickets')
  .get(reqTimeMonitor, vipTicketsController.getVipTickets)
  .patch(reqTimeMonitor, vipTicketsController.addTicketNote);
// endregion
// region Hive Routes
hiveRoutes.route('/reward-fund')
  .get(reqTimeMonitor, hiveController.getRewardFund);
hiveRoutes.route('/current-median-history')
  .get(reqTimeMonitor, hiveController.getCurrentMedianHistory);
hiveRoutes.route('/block-num')
  .get(reqTimeMonitor, hiveController.getBlockNum);
// endregion

module.exports = apiRoutes;
