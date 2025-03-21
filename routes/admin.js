const { Router } = require('express');
const { reqTimeMonitor } = require('../middlewares/statistics/reqRates');

const adminController = require('../controllers/adminController');

const adminRoutes = new Router();

adminRoutes.route('/admins/whitelist')
  .get(reqTimeMonitor, adminController.getWhitelist)
  .put(reqTimeMonitor, adminController.setWhitelist)
  .delete(reqTimeMonitor, adminController.deleteWhitelist);

adminRoutes.route('/admins/vip-tickets')
  .get(reqTimeMonitor, adminController.getVipTickets);

adminRoutes.route('/admins/sites')
  .get(reqTimeMonitor, adminController.manageView);
adminRoutes.route('/admins/sites/subscriptions')
  .get(reqTimeMonitor, adminController.subscriptionsView);
adminRoutes.route('/admins/sites/credits')
  .get(reqTimeMonitor, adminController.creditsView);

adminRoutes.route('/admins')
  .get(reqTimeMonitor, adminController.getAdmins);

adminRoutes.route('/admins/credits')
  .post(reqTimeMonitor, adminController.createCredits);

module.exports = adminRoutes;
