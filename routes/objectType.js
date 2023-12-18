const { Router } = require('express');
const { reqTimeMonitor } = require('../middlewares/statistics/reqRates');
const { ObjectTypeController } = require('../controllers');

const objectTypeRoutes = new Router();

objectTypeRoutes.route('/objectTypes')
  .post(reqTimeMonitor, ObjectTypeController.index);
objectTypeRoutes.route('/objectTypesSearch')
  .post(reqTimeMonitor, ObjectTypeController.search);
objectTypeRoutes.route('/objectType/:objectTypeName')
  .post(reqTimeMonitor, ObjectTypeController.show);
objectTypeRoutes.route('/objectType/:objectTypeName/expertise')
  .get(reqTimeMonitor, ObjectTypeController.expertise);
objectTypeRoutes.route('/objectType/showMoreTags')
  .get(reqTimeMonitor, ObjectTypeController.showMoreTags);
objectTypeRoutes.route('/objectTypes/tags-for-filter')
  .post(reqTimeMonitor, ObjectTypeController.tagsForFilter);

module.exports = objectTypeRoutes;
