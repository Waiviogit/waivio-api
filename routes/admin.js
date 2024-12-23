const { Router } = require('express');
const { reqTimeMonitor } = require('../middlewares/statistics/reqRates');

const adminController = require('../controllers/adminController');

const adminRoutes = new Router();

adminRoutes.route('/admin/whitelist')
  .get(reqTimeMonitor, adminController.getWhitelist)
  .put(reqTimeMonitor, adminController.setWhitelist)
  .delete(reqTimeMonitor, adminController.deleteWhitelist);

adminRoutes.route('/admin/vip-tickets')
  .get(reqTimeMonitor, adminController.getVipTickets);

adminRoutes.route('/admin/sites')
  .get(reqTimeMonitor, adminController.manageView);

module.exports = adminRoutes;
