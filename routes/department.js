const { Router } = require('express');
const { reqTimeMonitor } = require('../middlewares/statistics/reqRates');
const DepartmentController = require('../controllers/departmentController');

const departmentRoutes = new Router();

departmentRoutes.route('/departments')
  .post(reqTimeMonitor, DepartmentController.getDepartments);
departmentRoutes.route('/departments/wobjects')
  .post(reqTimeMonitor, DepartmentController.getWobjectsByDepartments);
departmentRoutes.route('/departments/search')
  .post(reqTimeMonitor, DepartmentController.getDepartmentsSearch);

module.exports = departmentRoutes;
