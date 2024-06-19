const { shopController } = require('controllers');
const { Router } = require('express');
const { reqTimeMonitor } = require('../middlewares/statistics/reqRates');

const shopRoutes = new Router();

shopRoutes.route('/shop/department-feed').post(reqTimeMonitor, shopController.getFeedByDepartment);
shopRoutes.route('/shop/main-feed').post(reqTimeMonitor, shopController.getFeed);
shopRoutes.route('/shop/departments').post(reqTimeMonitor, shopController.getDepartments);
shopRoutes.route('/shop/filters').post(reqTimeMonitor, shopController.getFilters);
shopRoutes.route('/shop/filters/tags').post(reqTimeMonitor, shopController.getMoreTags);
shopRoutes.route('/shop/state').post(reqTimeMonitor, shopController.restoreShopState);

shopRoutes.route('/shop/user/departments').post(reqTimeMonitor, shopController.getUserDepartments);
shopRoutes.route('/shop/user/department-feed').post(reqTimeMonitor, shopController.getUserFeedByDepartment);
shopRoutes.route('/shop/user/main-feed').post(reqTimeMonitor, shopController.getUserFeed);
shopRoutes.route('/shop/user/filters').post(reqTimeMonitor, shopController.getUserFilters);
shopRoutes.route('/shop/user/filters/tags').post(reqTimeMonitor, shopController.getUserTags);

shopRoutes.route('/shop/wobject/departments').post(reqTimeMonitor, shopController.getWobjectDepartments);
shopRoutes.route('/shop/wobject/department-feed').post(reqTimeMonitor, shopController.getWobjectDepartmentFeed);
shopRoutes.route('/shop/wobject/main-feed').post(reqTimeMonitor, shopController.getWobjectMainFeed);
shopRoutes.route('/shop/wobject/filters').post(reqTimeMonitor, shopController.getWobjectFilters);
shopRoutes.route('/shop/wobject/filters/tags').post(reqTimeMonitor, shopController.getWobjectTags);

shopRoutes.route('/shop/wobject/reference')
  .post(reqTimeMonitor, shopController.getAllReferences);
shopRoutes.route('/shop/wobject/reference/type')
  .post(reqTimeMonitor, shopController.getReferencesByType);
shopRoutes.route('/shop/wobject/related')
  .post(reqTimeMonitor, shopController.getRelated);
shopRoutes.route('/shop/wobject/similar')
  .post(reqTimeMonitor, shopController.getSimilar);
shopRoutes.route('/shop/wobject/add-on')
  .post(reqTimeMonitor, shopController.getAddon);

module.exports = shopRoutes;
