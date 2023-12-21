const { Router } = require('express');
const { reqTimeMonitor } = require('../middlewares/statistics/reqRates');
const { vipTicketsController } = require('../controllers');

const ticketsRoutes = new Router();

ticketsRoutes.route('/vip-tickets')
  .get(reqTimeMonitor, vipTicketsController.getVipTickets)
  .patch(reqTimeMonitor, vipTicketsController.addTicketNote);

module.exports = ticketsRoutes;
