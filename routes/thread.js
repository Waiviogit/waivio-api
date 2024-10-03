const { Router } = require('express');
const ThreadsController = require('../controllers/threadsController');

const threadRotes = new Router();

threadRotes.route('/thread/hashtag')
  .get(ThreadsController.byHashtag);
threadRotes.route('/thread/user')
  .get(ThreadsController.byUser);
threadRotes.route('/thread/hashtag/count')
  .get(ThreadsController.hashtagsCount);

module.exports = threadRotes;
