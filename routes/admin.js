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
adminRoutes.route('/admins/statistics/report')
  .post(reqTimeMonitor, adminController.statisticReportAdmin);

adminRoutes.route('/admins/guests/users')
  .post(reqTimeMonitor, adminController.getGuestUsers);
adminRoutes.route('/admins/guests/spam')
  .post(reqTimeMonitor, adminController.getGuestUsersSpam);
adminRoutes.route('/admins/guests/spam/:name')
  .post(reqTimeMonitor, adminController.getGuestUsersSpamList);
adminRoutes.route('/admins/guests/block')
  .post(reqTimeMonitor, adminController.blockGuest);

module.exports = adminRoutes;
