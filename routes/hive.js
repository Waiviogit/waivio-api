const { Router } = require('express');
const { reqTimeMonitor } = require('../middlewares/statistics/reqRates');
const HiveController = require('../controllers/hiveController');

const hiveRoutes = new Router();

hiveRoutes.route('/hive/reward-fund')
  .get(reqTimeMonitor, HiveController.getRewardFund);
hiveRoutes.route('/hive/current-median-history')
  .get(reqTimeMonitor, HiveController.getCurrentMedianHistory);
hiveRoutes.route('/hive/global-properties')
  .get(reqTimeMonitor, HiveController.getGlobalProperties);
hiveRoutes.route('/hive/block-num')
  .get(reqTimeMonitor, HiveController.getBlockNum);

module.exports = hiveRoutes;
