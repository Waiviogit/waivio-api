const { Router } = require('express');
const { sitesController } = require('controllers');
const { reqTimeMonitor } = require('../middlewares/statistics/reqRates');

const sitesRoutes = new Router();

sitesRoutes.route('/sites')
  .get(reqTimeMonitor, sitesController.getUserApps)
  .post(reqTimeMonitor, sitesController.firstLoad)
  .delete(reqTimeMonitor, sitesController.delete);
sitesRoutes.route('/sites/parent-host')
  .get(reqTimeMonitor, sitesController.getParentHost);
sitesRoutes.route('/sites/info')
  .get(reqTimeMonitor, sitesController.info);
sitesRoutes.route('/sites/getParents')
  .get(reqTimeMonitor, sitesController.parentList);
sitesRoutes.route('/sites/create')
  .put(reqTimeMonitor, sitesController.create);
sitesRoutes.route('/sites/checkAvailable')
  .get(reqTimeMonitor, sitesController.availableCheck);
sitesRoutes.route('/sites/check-ns')
  .get(reqTimeMonitor, sitesController.checkNs);
sitesRoutes.route('/sites/configuration')
  .get(reqTimeMonitor, sitesController.configurationsList)
  .post(reqTimeMonitor, sitesController.saveConfigurations);
sitesRoutes.route('/sites/ad-sense')
  .get(reqTimeMonitor, sitesController.getAdSense);
sitesRoutes.route('/sites/manage')
  .get(reqTimeMonitor, sitesController.managePage);
sitesRoutes.route('/sites/report')
  .get(reqTimeMonitor, sitesController.report);
sitesRoutes.route('/sites/refunds')
  .get(reqTimeMonitor, sitesController.refundList);
sitesRoutes.route('/sites/administrators')
  .get(reqTimeMonitor, sitesController.siteAuthorities);
sitesRoutes.route('/sites/moderators')
  .get(reqTimeMonitor, sitesController.siteAuthorities);
sitesRoutes.route('/sites/authorities')
  .get(reqTimeMonitor, sitesController.siteAuthorities);
sitesRoutes.route('/sites/filters')
  .get(reqTimeMonitor, sitesController.getObjectFilters)
  .post(reqTimeMonitor, sitesController.saveObjectFilters);
sitesRoutes.route('/sites/tags')
  .get(reqTimeMonitor, sitesController.findTags);
sitesRoutes.route('/sites/map')
  .get(reqTimeMonitor, sitesController.getMapCoordinates)
  .post(reqTimeMonitor, sitesController.getMapData)
  .put(reqTimeMonitor, sitesController.setMapCoordinates);
sitesRoutes.route('/sites/settings')
  .get(reqTimeMonitor, sitesController.getSettings);
sitesRoutes.route('/sites/restrictions')
  .get(reqTimeMonitor, sitesController.getRestrictions);
sitesRoutes.route('/sites/prefetch')
  .get(reqTimeMonitor, sitesController.getPrefetchesList)
  .post(reqTimeMonitor, sitesController.createPrefetch)
  .put(reqTimeMonitor, sitesController.updatePrefetchesList);
sitesRoutes.route('/sites/all-prefetches')
  .get(reqTimeMonitor, sitesController.showAllPrefetches);
sitesRoutes.route('/sites/affiliate')
  .get(reqTimeMonitor, sitesController.getAffiliateList)
  .put(reqTimeMonitor, sitesController.updateAffiliateList);

module.exports = sitesRoutes;
