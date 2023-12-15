const { Router } = require('express');
const { reqTimeMonitor } = require('../middlewares/statistics/reqRates');
const { departmentController } = require('../controllers');

const departmentRoutes = new Router();

departmentRoutes.route('/departments')
  .post(reqTimeMonitor, departmentController.getDepartments);
departmentRoutes.route('/departments/wobjects')
  .post(reqTimeMonitor, departmentController.getWobjectsByDepartments);
departmentRoutes.route('/departments/search')
  .post(reqTimeMonitor, departmentController.getDepartmentsSearch);

module.exports = departmentRoutes;
