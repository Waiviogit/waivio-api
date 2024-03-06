const { Router } = require('express');
const { threadsController } = require('../controllers');

const threadRotes = new Router();

threadRotes.route('/thread/hashtag')
  .get(threadsController.byHashtag);
threadRotes.route('/thread/user')
  .get(threadsController.byUser);
threadRotes.route('/thread/hashtag/count')
  .get(threadsController.hashtagsCount);

module.exports = threadRotes;
