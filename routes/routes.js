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
} = require('controllers');

const apiRoutes = new Router();
const wobjRoutes = new Router();
const userRoutes = new Router();
const postRoutes = new Router();
const appRoutes = new Router();
const objectTypeRoutes = new Router();
const sitesRoutes = new Router();
const ticketsRoutes = new Router();

apiRoutes.use('/api', wobjRoutes);
apiRoutes.use('/api', userRoutes);
apiRoutes.use('/api', postRoutes);
apiRoutes.use('/api', appRoutes);
apiRoutes.use('/api', objectTypeRoutes);
apiRoutes.use('/api', sitesRoutes);
apiRoutes.use('/api', ticketsRoutes);

// region Sites
sitesRoutes.route('/sites')
  .get(sitesController.getUserApps)
  .post(sitesController.firstLoad)
  .delete(sitesController.delete);
sitesRoutes.route('/sites/info')
  .get(sitesController.info);
sitesRoutes.route('/sites/getParents')
  .get(sitesController.parentList);
sitesRoutes.route('/sites/create')
  .put(sitesController.create);
sitesRoutes.route('/sites/checkAvailable')
  .get(sitesController.availableCheck);
sitesRoutes.route('/sites/configuration')
  .get(sitesController.configurationsList)
  .post(sitesController.saveConfigurations);
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
// endregion
// region User
userRoutes.route('/users')
  .get(UserController.index);
userRoutes.route('/user/:userName')
  .get(UserController.show);
userRoutes.route('/user/getUsersData')
  .post(UserController.usersData);
userRoutes.route('/user/:userName/setState')
  .get(UserController.modalWindowMarker);
userRoutes.route('/user/:userName/getFollowingsState')
  .get(UserController.followingsState);
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
userRoutes.route('/geo-ip')
  .get(UserController.getGeoByIp)
  .put(UserController.putUserGeo);
userRoutes.route('/user/:userName/creation-date')
  .get(UserController.getCreationDate);
// endregion
// region Post
postRoutes.route('/post/:author/:permlink')
  .get(PostController.show);
postRoutes.route('/posts/getMany')
  .post(PostController.getManyPosts);
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

module.exports = apiRoutes;
