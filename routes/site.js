const { Router } = require('express');
const SitesController = require('controllers/sitesController');
const { reqTimeMonitor } = require('../middlewares/statistics/reqRates');

const sitesRoutes = new Router();

sitesRoutes.route('/sites')
  .get(reqTimeMonitor, SitesController.getUserApps)
  .post(reqTimeMonitor, SitesController.firstLoad)
  .delete(reqTimeMonitor, SitesController.delete);
sitesRoutes.route('/sites/parent-host')
  .get(reqTimeMonitor, SitesController.getParentHost);
sitesRoutes.route('/sites/info')
  .get(reqTimeMonitor, SitesController.info);
sitesRoutes.route('/sites/getParents')
  .get(reqTimeMonitor, SitesController.parentList);
sitesRoutes.route('/sites/create')
  .put(reqTimeMonitor, SitesController.create);
sitesRoutes.route('/sites/checkAvailable')
  .get(reqTimeMonitor, SitesController.availableCheck);
sitesRoutes.route('/sites/check-ns')
  .get(reqTimeMonitor, SitesController.checkNs);
sitesRoutes.route('/sites/configuration')
  .get(reqTimeMonitor, SitesController.configurationsList)
  .post(reqTimeMonitor, SitesController.saveConfigurations);
sitesRoutes.route('/sites/ad-sense')
  .get(reqTimeMonitor, SitesController.getAdSense);
sitesRoutes.route('/sites/manage')
  .get(reqTimeMonitor, SitesController.managePage);
sitesRoutes.route('/sites/report')
  .get(reqTimeMonitor, SitesController.report);
sitesRoutes.route('/sites/refunds')
  .get(reqTimeMonitor, SitesController.refundList);
sitesRoutes.route('/sites/administrators')
  .get(reqTimeMonitor, SitesController.siteAuthorities);
sitesRoutes.route('/sites/moderators')
  .get(reqTimeMonitor, SitesController.siteAuthorities);
sitesRoutes.route('/sites/authorities')
  .get(reqTimeMonitor, SitesController.siteAuthorities);
sitesRoutes.route('/sites/filters')
  .get(reqTimeMonitor, SitesController.getObjectFilters)
  .post(reqTimeMonitor, SitesController.saveObjectFilters);
sitesRoutes.route('/sites/tags')
  .get(reqTimeMonitor, SitesController.findTags);
sitesRoutes.route('/sites/map')
  .get(reqTimeMonitor, SitesController.getMapCoordinates)
  .post(reqTimeMonitor, SitesController.getMapData)
  .put(reqTimeMonitor, SitesController.setMapCoordinates);
sitesRoutes.route('/sites/settings')
  .get(reqTimeMonitor, SitesController.getSettings);
sitesRoutes.route('/sites/restrictions')
  .get(reqTimeMonitor, SitesController.getRestrictions);
sitesRoutes.route('/sites/prefetch')
  .get(reqTimeMonitor, SitesController.getPrefetchesList)
  .post(reqTimeMonitor, SitesController.createPrefetch)
  .put(reqTimeMonitor, SitesController.updatePrefetchesList);
sitesRoutes.route('/sites/all-prefetches')
  .get(reqTimeMonitor, SitesController.showAllPrefetches);
sitesRoutes.route('/sites/affiliate')
  .get(reqTimeMonitor, SitesController.getAffiliateList)
  .put(reqTimeMonitor, SitesController.updateAffiliateList);
sitesRoutes.route('/sites/description')
  .get(reqTimeMonitor, SitesController.getDescription);
sitesRoutes.route('/sites/assistant/custom')
  .post(reqTimeMonitor, SitesController.updateAiStore);

module.exports = sitesRoutes;
