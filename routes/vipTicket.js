const { Router } = require('express');
const { reqTimeMonitor } = require('../middlewares/statistics/reqRates');
const VipTicketsController = require('../controllers/vipTicketsController');

const ticketsRoutes = new Router();

ticketsRoutes.route('/vip-tickets')
  .get(reqTimeMonitor, VipTicketsController.getVipTickets)
  .patch(reqTimeMonitor, VipTicketsController.addTicketNote);

module.exports = ticketsRoutes;
