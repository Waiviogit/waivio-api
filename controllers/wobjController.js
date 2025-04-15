const { Wobj, Post } = require('../models');
const {
  objectExperts, wobjectInfo, getManyObjects,
  getPostsByWobject, getGallery, getWobjField, sortFollowers, getRelated,
  getWobjsNearby, countWobjsByArea, getChildren, objectsOnMap, campaignOps, 
  getWobjectsNames, getByOptionsCategory, getFeatured,
  getWobjectAuthorities, getByGroupId, recountListItems, getListItemLocales, mapObject,
  getWobjectPinnedPosts, objectGroup, getByRating, getWithActiveCampaigns,
} = require('../utilities/operations').wobject;
const {
  wobjects: {
    searchWobjects, defaultWobjectSearch, addRequestDetails, searchByArea,
  },
} = require('../utilities/operations').search;
const validators = require('./validators');
const {
  getIpFromHeaders,
} = require('../utilities/helpers/sitesHelper');
const { checkIfWobjectExists } = require('../utilities/operations/wobject/checkIfWobjectExists');
const { getFields, getOneField } = require('../utilities/operations/wobject/getFields');
const { getCountryCodeFromIp } = require('../utilities/helpers/sitesHelper');
const pipelineFunctions = require('../pipeline');
const RequestPipeline = require('../pipeline/requestPipeline');

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

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.moderateObjects)
    .use(pipelineFunctions.checkObjectFollowings)
    .execute({ wobjects: wObjectsData, hasMore }, req);

  return res.status(200).json(processedData);
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

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.checkBellNotifications)
    .use(pipelineFunctions.checkObjectFollowings)
    .execute(wobjectData, req);

  return res.status(200).json(processedData);
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

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.fillPosts)
    .use(pipelineFunctions.moderateObjects)
    .use(pipelineFunctions.checkFollowers)
    .use(pipelineFunctions.checkFollowings)
    .execute(wobjectPosts, req);

  return res.status(200).json(processedData);
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

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.fillPosts)
    .use(pipelineFunctions.moderateObjects)
    .execute(wobjectPosts, req);

  return res.status(200).json(processedData);
};

const feed = async (req, res, next) => {
  const value = validators.validate({
    filter: req.body.filter,
    limit: req.body.limit,
    skip: req.body.skip,
  }, validators.wobject.feedScheme, next);

  if (!value) return;

  const { posts: AllPosts, error } = await Post.getAllPosts(value);
  if (error) return next(error);

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.fillPosts)
    .use(pipelineFunctions.moderateObjects)
    .execute(AllPosts, req);

  return res.status(200).json(processedData);
};

const followers = async (req, res, next) => {
  const value = validators.validate({
    author_permlink: req.params.authorPermlink,
    ...req.body,
  }, validators.wobject.followersScheme, next);

  if (!value) return;

  const { result } = await sortFollowers(value);

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.checkFollowers)
    .use(pipelineFunctions.checkFollowings)
    .execute(result, req);

  return res.status(200).json(processedData);
};

const search = async (req, res, next) => {
  const value = validators.validate({
    string: req.body.search_string,
    ...req.body,
  }, validators.wobject.searchScheme, next);

  if (!value) return;

  const { wobjects, hasMore, error } = await searchWobjects(value);

  if (error) return next(error);

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.moderateObjects)
    .use(pipelineFunctions.filterUniqGroupId)
    .execute({ wobjects, hasMore }, req);

  return res.status(200).json(processedData);
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

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.moderateObjects)
    .execute({ wobjects, hasMore }, req);

  return res.status(200).json(processedData);
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

  return res.status(200).json(result);
};

const objectExpertise = async (req, res, next) => {
  const value = validators.validate({
    author_permlink: req.params.authorPermlink,
    ...req.body,
  }, validators.wobject.objectExpertiseScheme, next);

  if (!value) return;
  const { experts, userExpert, error } = await objectExperts.getWobjExperts(value);

  if (error) return next(error);

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.checkFollowers)
    .use(pipelineFunctions.checkFollowings)
    .execute({ users: experts, user: userExpert }, req);

  return res.status(200).json(processedData);
};

const getByField = async (req, res, next) => {
  const value = validators.validate({
    fieldName: req.query.fieldName,
    fieldBody: req.query.fieldBody,
  }, validators.wobject.getByFieldScheme, next);

  if (!value) return;
  const { wobjects, error } = await Wobj.getByField(value);

  if (error) return next(error);

  return res.status(200).json(wobjects);
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

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.moderateObjects)
    .execute(wobjects, req);

  return res.status(200).json(processedData);
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
  const { toDisplay, field, error } = await getWobjField({ ...value, app: req.appData });
  if (error) return next(error);

  return res.status(200).json({ toDisplay, field });
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

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.moderateObjects)
    .execute(wobjects, req);

  return res.status(200).json(processedData);
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

  return res.status(200).json(wobjectCounts);
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

  return res.status(200).json(json);
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

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.checkFollowers)
    .use(pipelineFunctions.checkFollowings)
    .execute({ users, hasMore }, req);

  return res.status(200).json(processedData);
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

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.fillPosts)
    .use(pipelineFunctions.moderateObjects)
    .execute({ wobjects, hasMore }, req);

  return res.status(200).json(processedData);
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

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.moderateObjects)
    .execute({ wobjects, hasMore }, req);

  return res.status(200).json(processedData);
};

const checkIfObjectExists = async (req, res, next) => {
  const value = validators.validate({
    authorPermlink: req.params.authorPermlink,
  }, validators.wobject.authorPermlinkScheme, next);
  if (!value) return;

  const { exist, error } = await checkIfWobjectExists(value);
  if (error) return next(error);

  return res.status(200).json({ exist });
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

  return res.status(200).json({ fields, hasMore });
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

  return res.status(200).json(wobjectPosts);
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

  return res.status(200).json({ wobjects });
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

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.moderateObjects)
    .execute({ wobjects, hasMore }, req);

  return res.status(200).json(processedData);
};

const getAuthorities = async (req, res, next) => {
  const { result, error } = await getWobjectAuthorities(req.params.authorPermlink);
  if (error) return next(error);

  return res.status(200).json(result);
};

const getListItemsLocales = async (req, res, next) => {
  const result = await getListItemLocales(req.params);

  return res.status(200).json(result);
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

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.moderateObjects)
    .execute({ wobjects, hasMore }, req);

  return res.status(200).json(processedData);
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

  return res.status(200).json({ result });
};

const getListLinks = async (req, res, next) => {
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

  return res.status(200).json(result);
};

const getListLinksAuthority = async (req, res, next) => {
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

  return res.status(200).json(result);
};

const getListDepartments = async (req, res, next) => {
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

  return res.status(200).json(result);
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

  return res.status(200).json({ result });
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

  return res.status(200).json({ result, hasMore });
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

  return res.status(200).json(result);
};

const getAuthorPermlinkByIdType = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.wobject.getAuthorPermlinkByIdType,
    next,
  );

  if (!value) return;

  const result = await wobjectInfo.getAuthorPermlinkByIdType(value);

  return res.status(200).json(result);
};

const getAuthorPermlinkByFieldBody = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.wobject.getAuthorPermlinkByFieldBody,
    next,
  );

  if (!value) return;
  const result = await wobjectInfo.getAuthorPermlinkByFieldBody(value);

  return res.status(200).json(result);
};

const getMapObjectFromObjectLink = async (req, res, next) => {
  const value = validators.validate(
    { authorPermlink: req.params.authorPermlink },
    validators.wobject.mapObjectFromObjectLinkScheme,
    next,
  );

  if (!value) return;

  const result = await mapObject.getMapObjectFromObjectLink({
    ...value,
    app: req.appData,
  });

  return res.status(200).json({ result });
};

const getGroupByPermlink = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.wobject.getGroupByPermlink,
    next,
  );

  if (!value) return;

  const {
    result, hasMore, nextCursor, error,
  } = await objectGroup.getObjectGroup({
    ...value,
    app: req.appData,
  });
  if (error) return next(error);

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.checkFollowings)
    .use(pipelineFunctions.checkFollowers)
    .execute({ result, hasMore, nextCursor }, req);

  return res.status(200).json(processedData);
};

const searchArea = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.wobject.searchAreaSchema,
    next,
  );

  if (!value) return;

  addRequestDetails(value);

  const { wobjects, error } = await searchByArea({ ...value, app: req.appData });

  if (error) return next(error);

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.moderateObjects)
    .execute({ wobjects }, req);

  return res.status(200).json(processedData);
};

const checkLinkSafety = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.wobject.linkSafetyScheme,
    next,
  );

  if (!value) return;

  const { result, error } = await getByRating.checkLinkSafety(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

const getWobjectsWithCampaigns = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.wobject.activeCampaignsScheme,
    next,
  );

  if (!value) return;

  const { wobjects, hasMore } = await getWithActiveCampaigns({
    ...value,
    app: req.appData,
  });

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.moderateObjects)
    .execute({ wobjects, hasMore }, req);

  return res.status(200).json(processedData);
};

const getFeaturedObjects = async (req, res, next) => {
  const value = validators.validate(
    { ...req.params, ...req.body, locale: req.headers.locale },
    validators.wobject.getFeaturedObjectsScheme,
    next,
  );
  if (!value) return;
  const ip = await getIpFromHeaders(req);
  const countryCode = await getCountryCodeFromIp(ip);

  const { wobjects, hasMore } = await getFeatured({
    ...value,
    app: req.appData,
    countryCode,
  });

  return res.status(200).json({ wobjects, hasMore });
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
  getAuthorPermlinkByIdType,
  getMapObjectFromObjectLink,
  getAuthorPermlinkByFieldBody,
  getGroupByPermlink,
  searchArea,
  checkLinkSafety,
  getWobjectsWithCampaigns,
  getFeaturedObjects,
};
