const { Router } = require('express');
const { reqTimeMonitor } = require('../middlewares/statistics/reqRates');
const { hiveController } = require('../controllers');

const hiveRoutes = new Router();

hiveRoutes.route('/hive/reward-fund')
  .get(reqTimeMonitor, hiveController.getRewardFund);
hiveRoutes.route('/hive/current-median-history')
  .get(reqTimeMonitor, hiveController.getCurrentMedianHistory);
hiveRoutes.route('/hive/global-properties')
  .get(reqTimeMonitor, hiveController.getGlobalProperties);
hiveRoutes.route('/hive/block-num')
  .get(reqTimeMonitor, hiveController.getBlockNum);

module.exports = hiveRoutes;
