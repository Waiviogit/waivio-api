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
appRoutes.route('/safe-links')
  .get(reqTimeMonitor, AppController.getSafeLinks);
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
appRoutes.route('/places-api/image')
  .post(reqTimeMonitor, AppController.placesImage);
appRoutes.route('/places-api/objects')
  .post(reqTimeMonitor, AppController.placesObjects);
appRoutes.route('/places-api/text')
  .post(reqTimeMonitor, AppController.placesText);

module.exports = appRoutes;
