const { Router } = require('express');
const {
  WobjController,
  UserController,
  PostController,
  ObjectTypeController,
  AppController,
  ImageController,
  globalSearchController,
} = require('controllers');

const apiRoutes = new Router();
const wobjRoutes = new Router();
const userRoutes = new Router();
const postRoutes = new Router();
const appRoutes = new Router();
const objectTypeRoutes = new Router();

apiRoutes.use('/api', wobjRoutes);
apiRoutes.use('/api', userRoutes);
apiRoutes.use('/api', postRoutes);
apiRoutes.use('/api', appRoutes);
apiRoutes.use('/api', objectTypeRoutes);
// region Wobject
wobjRoutes.route('/wobject')
  .post(WobjController.index);
wobjRoutes.route('/wobject/:authorPermlink')
  .get(WobjController.show);
wobjRoutes.route('/wobject/:authorPermlink/posts')
  .post(WobjController.posts);
wobjRoutes.route('/wobject/:authorPermlink/followers')
  .post(WobjController.followers);
wobjRoutes.route('/wobject/:authorPermlink/fields')
  .post(WobjController.fields);
wobjRoutes.route('/wobject/:authorPermlink/gallery')
  .get(WobjController.gallery);
wobjRoutes.route('/wobject/:authorPermlink/list')
  .get(WobjController.list);
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
userRoutes.route('/user/:userName/following_objects')
  .post(UserController.objects_follow);
userRoutes.route('/user/:userName/following_users')
  .get(UserController.users_follow);
userRoutes.route('/user/:userName/followers')
  .get(UserController.followers);
userRoutes.route('/user/:userName/objects_feed')
  .post(UserController.objects_feed);
userRoutes.route('/user/:userName/feed')
  .post(UserController.feed);
userRoutes.route('/user/:userName/blog')
  .post(UserController.blog);
userRoutes.route('/user/:userName/comments')
  .get(UserController.getUserComments);
userRoutes.route('/user/:userName/objects_shares')
  .post(UserController.userObjectsShares);
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
userRoutes.route('/user/:userName/get_wobject_post_writers')
  .get(UserController.wobjectPostWriters);
userRoutes.route('/import_steem_user')
  .get(UserController.importUserFromSteem);
// endregion
// region Post
postRoutes.route('/post/:author/:permlink')
  .get(PostController.show);
postRoutes.route('/posts')
  .post(PostController.getByCategory);
postRoutes.route('/post_comments')
  .get(PostController.getPostComments);
// endregion
// region App
appRoutes.route('/app/:appName')
  .get(AppController.show);
appRoutes.route('/app/:appName/experts')
  .get(AppController.experts);
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
// endregion
// region Search
userRoutes.route('/generalSearch')
  .post(globalSearchController.globalSearch);
// endregion
module.exports = apiRoutes;
