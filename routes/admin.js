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

adminRoutes.route('/admins')
  .get(reqTimeMonitor, adminController.getAdmins);

module.exports = adminRoutes;
