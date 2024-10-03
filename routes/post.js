const { Router } = require('express');
const { reqTimeMonitor } = require('../middlewares/statistics/reqRates');
const PostController = require('../controllers/postController');

const postRoutes = new Router();

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
postRoutes.route('/posts/mentions')
  .post(reqTimeMonitor, PostController.getPostsByMentions);

module.exports = postRoutes;
