const {
    WobjController,
    UserController,
    PostController
} = require('../controllers');
const express = require('express');

const apiRoutes = express.Router();
const wobjRoutes = express.Router();
const userRoutes = express.Router();
const postRoutes = express.Router();

apiRoutes.use('/api', wobjRoutes);
apiRoutes.use('/api', userRoutes);
apiRoutes.use('/api', postRoutes);

wobjRoutes.route('/wobject')
    .post(WobjController.index);

wobjRoutes.route('/wobjectCreate')
    .post(WobjController.create);

wobjRoutes.route('/wobject/:authorPermlink')
    .get(WobjController.show)
    .post(WobjController.addField);
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

userRoutes.route('/user')
    .get(UserController.index)
    .post(UserController.create);
userRoutes.route('/user/:userName')
    .get(UserController.show);
userRoutes.route('/user/:userName/following_objects')
    .post(UserController.objects_follow);
userRoutes.route('/user/:userName/objects_feed')
    .post(UserController.objects_feed);
userRoutes.route('/user/:userName/feed')
    .post(UserController.feed);
userRoutes.route('/user/:userName/objects_shares')
    .post(UserController.userObjectsShares);

postRoutes.route('/post/:author/:permlink')
    .get(PostController.show);
postRoutes.route('/post')
    .post(PostController.getPostsByCategory);



module.exports = apiRoutes;