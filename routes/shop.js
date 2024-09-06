const ShopController = require('controllers/shopController');
const { Router } = require('express');
const { reqTimeMonitor } = require('../middlewares/statistics/reqRates');

const shopRoutes = new Router();

shopRoutes.route('/shop/department-feed').post(reqTimeMonitor, ShopController.getFeedByDepartment);
shopRoutes.route('/shop/main-feed').post(reqTimeMonitor, ShopController.getFeed);
shopRoutes.route('/shop/departments').post(reqTimeMonitor, ShopController.getDepartments);
shopRoutes.route('/shop/filters').post(reqTimeMonitor, ShopController.getFilters);
shopRoutes.route('/shop/filters/tags').post(reqTimeMonitor, ShopController.getMoreTags);
shopRoutes.route('/shop/state').post(reqTimeMonitor, ShopController.restoreShopState);

shopRoutes.route('/shop/user/departments').post(reqTimeMonitor, ShopController.getUserDepartments);
shopRoutes.route('/shop/user/department-feed').post(reqTimeMonitor, ShopController.getUserFeedByDepartment);
shopRoutes.route('/shop/user/main-feed').post(reqTimeMonitor, ShopController.getUserFeed);
shopRoutes.route('/shop/user/filters').post(reqTimeMonitor, ShopController.getUserFilters);
shopRoutes.route('/shop/user/filters/tags').post(reqTimeMonitor, ShopController.getUserTags);

shopRoutes.route('/shop/wobject/departments').post(reqTimeMonitor, ShopController.getWobjectDepartments);
shopRoutes.route('/shop/wobject/department-feed').post(reqTimeMonitor, ShopController.getWobjectDepartmentFeed);
shopRoutes.route('/shop/wobject/main-feed').post(reqTimeMonitor, ShopController.getWobjectMainFeed);
shopRoutes.route('/shop/wobject/filters').post(reqTimeMonitor, ShopController.getWobjectFilters);
shopRoutes.route('/shop/wobject/filters/tags').post(reqTimeMonitor, ShopController.getWobjectTags);

shopRoutes.route('/shop/wobject/reference')
  .post(reqTimeMonitor, ShopController.getAllReferences);
shopRoutes.route('/shop/wobject/reference/type')
  .post(reqTimeMonitor, ShopController.getReferencesByType);
shopRoutes.route('/shop/wobject/related')
  .post(reqTimeMonitor, ShopController.getRelated);
shopRoutes.route('/shop/wobject/similar')
  .post(reqTimeMonitor, ShopController.getSimilar);
shopRoutes.route('/shop/wobject/add-on')
  .post(reqTimeMonitor, ShopController.getAddon);

module.exports = shopRoutes;
