const { Router } = require('express');
const { reqTimeMonitor } = require('../middlewares/statistics/reqRates');
const ObjectTypeController = require('../controllers/objectTypeController');

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
objectTypeRoutes.route('/objectType/:objectTypeName/tag-categories')
  .post(reqTimeMonitor, ObjectTypeController.tagCategories);
objectTypeRoutes.route('/objectType/:objectTypeName/tag-categories/:tagCategory')
  .get(reqTimeMonitor, ObjectTypeController.tagCategoryDetails);
objectTypeRoutes.route('/objectTypes/tags-for-filter')
  .post(reqTimeMonitor, ObjectTypeController.tagsForFilter);

module.exports = objectTypeRoutes;
