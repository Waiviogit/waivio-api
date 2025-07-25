const { Router } = require('express');
const WobjController = require('../controllers/wobjController');
const { reqTimeMonitor } = require('../middlewares/statistics/reqRates');

const wobjRoutes = new Router();

wobjRoutes.route('/wobject')
  .post(reqTimeMonitor, WobjController.index);
wobjRoutes.route('/wobject/:authorPermlink/getField')
  .get(reqTimeMonitor, WobjController.getWobjectField);
wobjRoutes.route('/wobject/:authorPermlink')
  .get(reqTimeMonitor, WobjController.show);
wobjRoutes.route('/wobject/:authorPermlink/posts')
  .post(reqTimeMonitor, WobjController.posts);
wobjRoutes.route('/wobject/:authorPermlink/followers')
  .post(reqTimeMonitor, WobjController.followers);
wobjRoutes.route('/wobject/:authorPermlink/gallery')
  .get(reqTimeMonitor, WobjController.gallery);
wobjRoutes.route('/wobject/:authorPermlink/related')
  .get(reqTimeMonitor, WobjController.related);
wobjRoutes.route('/wobject/:authorPermlink/object_expertise')
  .post(reqTimeMonitor, WobjController.objectExpertise);
wobjRoutes.route('/wobjectSearch')
  .post(reqTimeMonitor, WobjController.search);
wobjRoutes.route('/wobjectsFeed')
  .post(reqTimeMonitor, WobjController.feed);
wobjRoutes.route('/wobjectsByField')
  .get(reqTimeMonitor, WobjController.getByField);
wobjRoutes.route('/wobject/:authorPermlink/child_wobjects')
  .get(reqTimeMonitor, WobjController.getChildWobjects);
wobjRoutes.route('/wobject/:authorPermlink/nearby')
  .get(reqTimeMonitor, WobjController.getWobjectsNearby);
wobjRoutes.route('/wobject/count/by-area')
  .get(reqTimeMonitor, WobjController.countWobjectsByArea);
wobjRoutes.route('/wobject/:authorPermlink/exist')
  .get(reqTimeMonitor, WobjController.checkIfObjectExists);
wobjRoutes.route('/wobject/:authorPermlink/fields')
  .get(reqTimeMonitor, WobjController.getWobjectUpdates);
wobjRoutes.route('/wobject/:authorPermlink/newsfeed')
  .post(reqTimeMonitor, WobjController.newsfeed);
wobjRoutes.route('/wobject/:authorPermlink/authority-fields')
  .get(reqTimeMonitor, WobjController.getAuthorities);
wobjRoutes.route('/wobject/:authorPermlink/list-item-locales/:itemLink')
  .get(reqTimeMonitor, WobjController.getListItemsLocales);
wobjRoutes.route('/wobject/:authorPermlink/pin')
  .get(reqTimeMonitor, WobjController.getPinnedPosts);
wobjRoutes.route('/wobject/:authorPermlink/map')
  .post(reqTimeMonitor, WobjController.getObjectsOnMap);
wobjRoutes.route('/wobject/:authorPermlink/map-link')
  .get(reqTimeMonitor, WobjController.getMapObjectFromObjectLink);
wobjRoutes.route('/wobject/:authorPermlink/map/list')
  .post(reqTimeMonitor, WobjController.getObjectsLinksOnMap);
wobjRoutes.route('/wobject/:authorPermlink/raw-field')
  .post(reqTimeMonitor, WobjController.getRawField);
wobjRoutes.route('/wobject/:authorPermlink/featured')
  .post(reqTimeMonitor, WobjController.getFeaturedObjects);
wobjRoutes.route('/wobject/:authorPermlink/instacart-link')
  .get(reqTimeMonitor, WobjController.getInstacartLink);

wobjRoutes.route('/wobjects/map/experts')
  .post(reqTimeMonitor, WobjController.getMapObjectExperts);
wobjRoutes.route('/wobjects/map/last-post')
  .post(reqTimeMonitor, WobjController.getMapObjectLastPost);
wobjRoutes.route('/wobjects/campaign/required-object')
  .post(reqTimeMonitor, WobjController.getWobjectsByRequiredObject);

wobjRoutes.route('/wobjects/names')
  .post(reqTimeMonitor, WobjController.getWobjectNames);
wobjRoutes.route('/wobjects/options')
  .post(reqTimeMonitor, WobjController.getWobjectOptions);
wobjRoutes.route('/wobjects/group-id')
  .post(reqTimeMonitor, WobjController.getWobjectsByGroupId);
wobjRoutes.route('/wobjects/list-item-process')
  .post(reqTimeMonitor, WobjController.recountList);
wobjRoutes.route('/wobjects/list-item-links')
  .post(reqTimeMonitor, WobjController.getListLinks);
wobjRoutes.route('/wobjects/list-item-links/authority')
  .post(reqTimeMonitor, WobjController.getListLinksAuthority);
wobjRoutes.route('/wobjects/list-item-departments')
  .post(reqTimeMonitor, WobjController.getListDepartments);
wobjRoutes.route('/wobjects/search-default')
  .post(reqTimeMonitor, WobjController.searchDefault);
wobjRoutes.route('/wobjects/search-area')
  .post(reqTimeMonitor, WobjController.searchArea);
wobjRoutes.route('/wobjects/id-type')
  .post(reqTimeMonitor, WobjController.getAuthorPermlinkByIdType);
wobjRoutes.route('/wobjects/field-body')
  .post(reqTimeMonitor, WobjController.getAuthorPermlinkByFieldBody);
wobjRoutes.route('/wobjects/group')
  .post(reqTimeMonitor, WobjController.getGroupByPermlink);
wobjRoutes.route('/wobjects/link/safety')
  .post(reqTimeMonitor, WobjController.checkLinkSafety);
wobjRoutes.route('/wobjects/active-campaigns')
  .post(reqTimeMonitor, WobjController.getWobjectsWithCampaigns);

module.exports = wobjRoutes;
