const { Router } = require('express');
const { reqTimeMonitor } = require('../middlewares/statistics/reqRates');

const AppController = require('../controllers/appController');
const ImageController = require('../controllers/imageController');
const GlobalSearchController = require('../controllers/globalSearchController');

const appRoutes = new Router();

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
appRoutes.route('/generalSearch')
  .post(reqTimeMonitor, GlobalSearchController.globalSearch);
appRoutes.route('/waiv/metrics')
  .get(reqTimeMonitor, AppController.waivMainMetrics);
appRoutes.route('/waiv/swap-history')
  .get(reqTimeMonitor, AppController.swapHistory);
appRoutes.route('/assistant')
  .post(reqTimeMonitor, AppController.assistant);
appRoutes.route('/assistant/history/:id')
  .get(reqTimeMonitor, AppController.assistantHistory);

module.exports = appRoutes;
