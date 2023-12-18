const { Router } = require('express');
const { reqTimeMonitor } = require('../middlewares/statistics/reqRates');
const { draftController } = require('../controllers');

const draftRotes = new Router();

draftRotes.route('/draft/post')
  .post(reqTimeMonitor, draftController.createOrUpdatePostDraft)
  .get(reqTimeMonitor, draftController.getOnePostDraft)
  .delete(reqTimeMonitor, draftController.deleteOnePostDraft);
draftRotes.route('/draft/posts')
  .get(reqTimeMonitor, draftController.getPostDrafts);
draftRotes.route('/draft/object')
  .post(reqTimeMonitor, draftController.createOrUpdatePageDraft)
  .get(reqTimeMonitor, draftController.getOnePageDraft);
draftRotes.route('/draft/comment')
  .post(reqTimeMonitor, draftController.createOrUpdateCommentDraft)
  .get(reqTimeMonitor, draftController.getOneCommentDraft);

module.exports = draftRotes;
