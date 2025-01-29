const { Router } = require('express');
const { reqTimeMonitor } = require('../middlewares/statistics/reqRates');
const DraftController = require('../controllers/draftController');

const draftRotes = new Router();

draftRotes.route('/draft/post')
  .post(reqTimeMonitor, DraftController.createOrUpdatePostDraft)
  .get(reqTimeMonitor, DraftController.getOnePostDraft)
  .delete(reqTimeMonitor, DraftController.deletePostDraft);
draftRotes.route('/draft/posts')
  .get(reqTimeMonitor, DraftController.getPostDrafts);
draftRotes.route('/draft/object')
  .post(reqTimeMonitor, DraftController.createOrUpdatePageDraft)
  .get(reqTimeMonitor, DraftController.getOnePageDraft);
draftRotes.route('/draft/comment')
  .post(reqTimeMonitor, DraftController.createOrUpdateCommentDraft)
  .get(reqTimeMonitor, DraftController.getOneCommentDraft);

module.exports = draftRotes;
