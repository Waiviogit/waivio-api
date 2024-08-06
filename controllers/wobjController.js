const { Wobj, Post } = require('models');
const {
  objectExperts, wobjectInfo, getManyObjects,
  getPostsByWobject, getGallery, getWobjField, sortFollowers, getRelated,
  getWobjsNearby, countWobjsByArea, getChildren, objectsOnMap, campaignOps, getWobjectsNames, getByOptionsCategory,
  getWobjectAuthorities, getByGroupId, recountListItems, getListItemLocales, mapObject,
  getWobjectPinnedPosts,
} = require('utilities/operations').wobject;
const { wobjects: { searchWobjects, defaultWobjectSearch, addRequestDetails} } = require('utilities/operations').search;
const validators = require('controllers/validators');
const {
  getIpFromHeaders,
} = require('utilities/helpers/sitesHelper');
const { checkIfWobjectExists } = require('../utilities/operations/wobject/checkIfWobjectExists');
const { getFields, getOneField } = require('../utilities/operations/wobject/getFields');
const { getCountryCodeFromIp } = require('../utilities/helpers/sitesHelper');

const index = async (req, res, next) => {
  const value = validators.validate({
    user_limit: req.body.userLimit,
    locale: req.body.locale,
    author_permlinks: req.body.author_permlinks,
    object_types: req.body.object_types,
    exclude_object_types: req.body.exclude_object_types,
    required_fields: req.body.required_fields,
    limit: req.body.limit,
    skip: req.body.skip,
    sample: req.body.sample,
    map: req.body.map,
    userName: req.headers.follower,
  }, validators.wobject.indexSchema, next);

  if (!value) return;

  const { wObjectsData, hasMore, error } = await getManyObjects.getMany(value);

  if (error) return next(error);

  res.result = { status: 200, json: { wobjects: wObjectsData, hasMore } };
  next();
};

// flag - Temporary solution
const show = async (req, res, next) => {
  const value = validators.validate({
    authorPermlink: req.params.authorPermlink,
    locale: req.headers.locale,
    ...req.query,
  }, validators.wobject.showSchema, next);

  if (!value) return;

  const ip = await getIpFromHeaders(req);

  const countryCode = await getCountryCodeFromIp(ip);

  const { wobjectData, error } = await wobjectInfo.getOne({
    ...value,
    ip,
    countryCode,
    app: req.appData,
  });

  if (error) return next(error);

  res.result = { status: 200, json: wobjectData };
  next();
};

const posts = async (req, res, next) => {
  const value = validators.validate({
    author_permlink: req.params.authorPermlink,
    limit: req.body.limit,
    skip: req.body.skip,
    user_languages: req.body.user_languages,
    forApp: req.headers.app,
    lastId: req.body.lastId,
    userName: req.headers.follower,
    newsPermlink: req.body.newsPermlink,
  }, validators.wobject.postsScheme, next);

  if (!value) return;

  const { posts: wobjectPosts, error } = await getPostsByWobject({ ...value, app: req.appData });

  if (error) return next(error);

  res.result = { status: 200, json: wobjectPosts };
  next();
};

const getPinnedPosts = async (req, res, next) => {
  const value = validators.validate({
    author_permlink: req.params.authorPermlink,
    locale: req.headers.locale,
    follower: req.headers.follower,
  }, validators.wobject.pinPostsScheme, next);

  if (!value) return;

  const { posts: wobjectPosts, error } = await getWobjectPinnedPosts({
    ...value, app: req.appData,
  });

  if (error) return next(error);

  res.result = { status: 200, json: wobjectPosts };
  next();
};

const feed = async (req, res, next) => {
  const value = validators.validate({
    filter: req.body.filter,
    limit: req.body.limit,
    skip: req.body.skip,
  }, validators.wobject.feedScheme, next);

  if (!value) return;

  const { posts: AllPosts, error } = await Post.getAllPosts(value);

  if (error) {
    return next(error);
  }
  res.result = { status: 200, json: AllPosts };
  next();
};

const followers = async (req, res, next) => {
  const value = validators.validate({
    author_permlink: req.params.authorPermlink,
    ...req.body,
  }, validators.wobject.followersScheme, next);

  if (!value) return;

  const { result } = await sortFollowers(value);

  res.result = { status: 200, json: result };
  next();
};

const search = async (req, res, next) => {
  const value = validators.validate({
    string: req.body.search_string,
    ...req.body,
  }, validators.wobject.searchScheme, next);

  if (!value) return;

  const { wobjects, hasMore, error } = await searchWobjects(value);

  if (error) return next(error);

  res.result = { status: 200, json: { wobjects, hasMore } };
  next();
};

// site-independent search
const searchDefault = async (req, res, next) => {
  const value = validators.validate({
    string: req.body.search_string,
    ...req.body,
  }, validators.wobject.searchScheme, next);

  if (!value) return;

  addRequestDetails(value);

  const { wobjects, hasMore, error } = await defaultWobjectSearch(value);

  if (error) return next(error);

  res.result = { status: 200, json: { wobjects, hasMore } };
  next();
};

const gallery = async (req, res, next) => {
  const value = validators.validate({
    authorPermlink: req.params.authorPermlink,
    locale: req.headers.locale,
    app: req.headers.app,
  }, validators.wobject.galleryScheme, next);

  if (!value) return;

  const { result, error } = await getGallery(value);

  if (error) return next(error);

  res.result = { status: 200, json: result };
  req.author_permlink = req.params.authorPermlink;
  next();
};

const objectExpertise = async (req, res, next) => {
  const value = validators.validate({
    author_permlink: req.params.authorPermlink,
    ...req.body,
  }, validators.wobject.objectExpertiseScheme, next);

  if (!value) return;
  const { experts, userExpert, error } = await objectExperts.getWobjExperts(value);

  if (error) {
    return next(error);
  }
  res.result = { status: 200, json: { users: experts, user: userExpert } };
  next();
};

const getByField = async (req, res, next) => {
  const value = validators.validate({
    fieldName: req.query.fieldName,
    fieldBody: req.query.fieldBody,
  }, validators.wobject.getByFieldScheme, next);

  if (!value) return;
  const { wobjects, error } = await Wobj.getByField(value);

  if (error) return next(error);
  res.result = { status: 200, json: wobjects };
  next();
};

const getChildWobjects = async (req, res, next) => {
  const value = validators.validate(
    { ...req.params, ...req.query },
    validators.wobject.getChildWobjects,
    next,
  );

  if (!value) return;
  const { wobjects, error } = await getChildren(value);

  if (error) return next(error);
  res.result = { status: 200, json: wobjects };
  next();
};

const getWobjectField = async (req, res, next) => {
  const value = validators.validate(
    Object.assign(req.query, {
      locale: req.headers.locale,
      app: req.headers.app,
      authorPermlink: req.params.authorPermlink,
      reqUserName: req.headers.follower,
    }),
    validators.wobject.getWobjectField,
    next,
  );
  if (!value) return;
  const { toDisplay, field, error } = await getWobjField(value);

  if (error) return next(error);
  res.result = { status: 200, json: { toDisplay, field } };
  next();
};

const getWobjectsNearby = async (req, res, next) => {
  const value = validators.validate(
    {
      authorPermlink: req.params.authorPermlink,
      ...req.query,
    },
    validators.wobject.getWobjectsNearby,
    next,
  );
  if (!value) return;
  const { wobjects, error } = await getWobjsNearby(value);

  if (error) return next(error);
  res.result = { status: 200, json: wobjects };
  next();
};

const countWobjectsByArea = async (req, res, next) => {
  const value = validators.validate(
    { ...req.query },
    validators.wobject.countWobjectsByArea,
    next,
  );
  if (!value) return;
  const { wobjects: wobjectCounts, error } = await countWobjsByArea(value);
  if (error) return next(error);

  res.result = { status: 200, json: wobjectCounts };
  next();
};

const related = async (req, res, next) => {
  const value = validators.validate(
    {
      ...req.params,
      ...req.query,
      ...req.headers,
    },
    validators.wobject.getRelatedAlbum,
    next,
  );
  if (!value) return;

  const { json, error } = await getRelated({
    ...value,
    app: req.appData,
  });
  if (error) return next(error);
  res.result = { status: 200, json };
  next();
};

const getMapObjectExperts = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.wobject.mapExpertsScheme,
    next,
  );
  if (!value) return;

  const { users, hasMore, error } = await objectsOnMap.getExpertsFromArea(
    { ...value, app: req.appData },
  );

  if (error) return next(error);
  res.result = { status: 200, json: { users, hasMore } };
  next();
};

const getMapObjectLastPost = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.wobject.mapLastPostScheme,
    next,
  );
  if (!value) return;

  const { wobjects, hasMore, error } = await objectsOnMap.getLastPostOnObjectFromArea(
    { ...value, app: req.appData },
  );

  if (error) return next(error);
  res.result = { status: 200, json: { wobjects, hasMore } };
  next();
};

const getWobjectsByRequiredObject = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.wobject.byRequiredWobjectScheme,
    next,
  );
  if (!value) return;

  const { wobjects, hasMore, error } = await campaignOps.getObjectsByRequired(
    { ...value, app: req.appData },
  );

  if (error) return next(error);
  res.result = { status: 200, json: { wobjects, hasMore } };
  next();
};

const checkIfObjectExists = async (req, res, next) => {
  const value = validators.validate({
    authorPermlink: req.params.authorPermlink,
  }, validators.wobject.authorPermlinkScheme, next);
  if (!value) return;

  const { exist, error } = await checkIfWobjectExists(value);
  if (error) return next(error);

  res.result = { status: 200, json: { exist } };
  next();
};

const getWobjectUpdates = async (req, res, next) => {
  const value = validators.validate(
    { ...req.params, ...req.query },
    validators.wobject.getFieldsScheme,
    next,
  );
  if (!value) return;

  const { fields, hasMore, error } = await getFields({ ...value, app: req.appData });
  if (error) return next(error);

  res.result = { status: 200, json: { fields, hasMore } };
  next();
};

const newsfeed = async (req, res, next) => {
  const value = validators.validate(
    {
      author_permlink: req.params.authorPermlink,
      limit: req.body.limit,
      skip: req.body.skip,
      user_languages: req.body.user_languages,
      lastId: req.body.lastId,
      userName: req.headers.follower,
      locale: req.headers.locale,
    },
    validators.wobject.getNewsfeed,
    next,
  );
  if (!value) return;

  const { posts: wobjectPosts, error } = await getPostsByWobject({
    ...value, app: req.appData, newsFeed: true,
  });

  if (error) return next(error);

  res.result = { status: 200, json: wobjectPosts };
  next();
};

const getWobjectNames = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.wobject.wobjectsNamesScheme,
    next,
  );
  if (!value) return;

  const { wobjects, error } = await getWobjectsNames({
    ...value, app: req.appData, locale: req.headers.locale,
  });
  if (error) return next(error);

  res.result = { status: 200, json: { wobjects } };
  next();
};

const getWobjectOptions = async (req, res, next) => {
  const value = validators.validate(
    { ...req.body, userName: req.headers.follower },
    validators.wobject.wobjectsOptionsScheme,
    next,
  );
  if (!value) return;

  const { wobjects, hasMore, error } = await getByOptionsCategory({
    ...value, app: req.appData, locale: req.headers.locale,
  });
  if (error) return next(error);

  res.result = { status: 200, json: { wobjects, hasMore } };
  next();
};

const getAuthorities = async (req, res, next) => {
  const { result, error } = await getWobjectAuthorities(req.params.authorPermlink);
  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};

const getListItemsLocales = async (req, res, next) => {
  const result = await getListItemLocales(req.params);

  res.result = { status: 200, json: result };
  next();
};

const getWobjectsByGroupId = async (req, res, next) => {
  const value = validators.validate(
    { ...req.body, userName: req.headers.follower },
    validators.wobject.wobjectsGroupIdScheme,
    next,
  );
  if (!value) return;

  const { wobjects, hasMore, error } = await getByGroupId(value);
  if (error) return next(error);

  res.result = { status: 200, json: { wobjects, hasMore } };
  next();
};

const recountList = async (req, res, next) => {
  const validKey = validators.apiKeyValidator.validateApiKey(req.headers['api-key']);
  if (!validKey) return next();
  const value = validators.validate(
    { ...req.body },
    validators.wobject.wobjectsRecountListItemsScheme,
    next,
  );

  if (!value) return;

  const { result, error } = await recountListItems(value);
  if (error) return next(error);

  res.result = { status: 200, json: { result } };
  next();
};

const getListLinks = async (req, res, next) => {
  // const validKey = validators.apiKeyValidator.validateApiKey(req.headers['api-key']);
//  if (!validKey) return next();
  const value = validators.validate(
    req.body,
    validators.wobject.wobjectsRecountListItemsScheme,
    next,
  );

  if (!value) return;

  const { result } = await wobjectInfo.getAllListPermlinks({
    ...value,
    app: req.appData,
  });

  res.result = { status: 200, json: result };
  next();
};

const getListLinksAuthority = async (req, res, next) => {
  // const validKey = validators.apiKeyValidator.validateApiKey(req.headers['api-key']);
//  if (!validKey) return next();
  const value = validators.validate(
    req.body,
    validators.wobject.wobjectsRecountListItemsScheme,
    next,
  );

  if (!value) return;

  const { result } = await wobjectInfo.getListsForAuthority({
    ...value,
    app: req.appData,
  });

  res.result = { status: 200, json: result };
  next();
};

const getListDepartments = async (req, res, next) => {
  // const validKey = validators.apiKeyValidator.validateApiKey(req.headers['api-key']);
//  if (!validKey) return next();
  const value = validators.validate(
    req.body,
    validators.wobject.wobjectsListDepartmentsScheme,
    next,
  );

  if (!value) return;

  const result = await wobjectInfo.getListDepartments({
    ...value,
    app: req.appData,
  });

  res.result = { status: 200, json: result };
  next();
};

const getObjectsOnMap = async (req, res, next) => {
  const value = validators.validate(
    {
      ...req.body,
      locale: req.headers.locale,
      authorPermlink: req.params.authorPermlink,
      follower: req.headers.follower,
    },
    validators.wobject.wobjectAdvancedMapScheme,
    next,
  );

  if (!value) return;

  const { result, error } = await mapObject.getObjectsFromAdvancedMap({
    ...value,
    app: req.appData,
  });
  if (error) return next(error);

  res.result = { status: 200, json: { result } };
  next();
};

const getObjectsLinksOnMap = async (req, res, next) => {
  const value = validators.validate(
    {
      ...req.body,
      locale: req.headers.locale,
      authorPermlink: req.params.authorPermlink,
      follower: req.headers.follower,
    },
    validators.wobject.wobjectAdvancedMapListScheme,
    next,
  );

  if (!value) return;

  const { result, hasMore, error } = await mapObject.getObjectLinksFromAdvancedMap({
    ...value,
    app: req.appData,
  });
  if (error) return next(error);

  res.result = { status: 200, json: { result, hasMore } };
  next();
};

const getRawField = async (req, res, next) => {
  const value = validators.validate(
    {
      ...req.body,
      authorPermlink: req.params.authorPermlink,
      locale: req.headers.locale,
    },
    validators.wobject.getRawField,
    next,
  );

  if (!value) return;

  const { result, error } = await getOneField(value);
  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};

module.exports = {
  index,
  show,
  posts,
  search,
  followers,
  gallery,
  feed,
  objectExpertise,
  getByField,
  getChildWobjects,
  getWobjectField,
  getWobjectsNearby,
  countWobjectsByArea,
  related,
  getMapObjectExperts,
  getMapObjectLastPost,
  getWobjectsByRequiredObject,
  checkIfObjectExists,
  getWobjectUpdates,
  getWobjectNames,
  newsfeed,
  getWobjectOptions,
  getAuthorities,
  getWobjectsByGroupId,
  recountList,
  getListLinks,
  getListDepartments,
  searchDefault,
  getListItemsLocales,
  getPinnedPosts,
  getObjectsOnMap,
  getRawField,
  getListLinksAuthority,
  getObjectsLinksOnMap,
};
