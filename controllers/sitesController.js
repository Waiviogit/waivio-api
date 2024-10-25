const validators = require('controllers/validators');
const authoriseUser = require('utilities/authorization/authoriseUser');
const { sitesHelper } = require('utilities/helpers');
const prefetchWobjs = require('utilities/operations/sites/prefetchWobjs');
const affiliateShop = require('utilities/operations/sites/affiliateShop');
const {
  sites: {
    objectsFilter, refunds, authorities, reports, restrictions,
    manage, create, configurations, remove, map, mapCoordinates,
  },
} = require('utilities/operations');
const { cacheWrapper } = require('../utilities/helpers/cacheHelper');
const {
  REDIS_KEYS,
  TTL_TIME,
} = require('../constants/common');
const pipelineFunctions = require('../pipeline');
const RequestPipeline = require('../pipeline/requestPipeline');
const { updateAiCustomStore } = require('../utilities/operations/assistant/migration/customByApp');

// cached controllers
const cachedFirstLoad = cacheWrapper(sitesHelper.firstLoad);
const cachedParentHost = cacheWrapper(sitesHelper.getParentHost);
const cachedSiteInfo = cacheWrapper(sitesHelper.siteInfo);
const cachedGetSettings = cacheWrapper(sitesHelper.getSettings);
const cachedAdSense = cacheWrapper(sitesHelper.getAdSense);

exports.create = async (req, res, next) => {
  const value = validators.validate(req.body, validators.sites.createApp, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.owner);
  if (authError) return next(authError);

  const { result, error } = await create.createApp(value);
  if (error) return next(error);

  return res.status(200).json({ result });
};

exports.info = async (req, res, next) => {
  if (!req.query.host) return next({ status: 422, message: 'App host is required' });

  const { result, error } = await cachedSiteInfo(req.query.host)({
    key: `${REDIS_KEYS.API_RES_CACHE}:cachedSiteInfo:${req.query.host}`,
    ttl: TTL_TIME.ONE_MINUTE,
  });
  if (error) return next(error);

  return res.status(200).json(result);
};

exports.delete = async (req, res, next) => {
  const value = validators.validate(req.body, validators.sites.delete, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const { result, error } = await remove.deleteWebsite(value);
  if (error) return next(error);

  return res.status(200).json({ result });
};

exports.availableCheck = async (req, res, next) => {
  const value = validators.validate(req.query, validators.sites.availableCheck, next);
  if (!value) return;

  const { result, error } = await sitesHelper.availableCheck(value);
  if (error) return next(error);

  return res.status(200).json({ result });
};

exports.checkNs = async (req, res, next) => {
  const value = validators.validate(req.query, validators.sites.checkNsSchema, next);
  if (!value) return;

  const { result, error } = await sitesHelper.checkNs(value);
  if (error) return next(error);

  return res.status(200).json({ result });
};

exports.parentList = async (req, res, next) => {
  const { parents, error } = await sitesHelper.getParentsList();
  if (error) return next(error);

  return res.status(200).json(parents);
};

exports.getUserApps = async (req, res, next) => {
  const value = validators.validate(req.query, validators.sites.getApps, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const { result, error } = await sitesHelper.getUserApps(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

exports.configurationsList = async (req, res, next) => {
  if (!req.query.host) return next({ status: 422, message: 'App host is required' });

  const { result, error } = await configurations.getConfigurationsList(req.query.host);
  if (error) return next(error);

  return res.status(200).json(result);
};

exports.saveConfigurations = async (req, res, next) => {
  const value = validators.validate(req.body, validators.sites.saveConfigurations, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const { result, error } = await configurations.saveConfigurations(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

exports.managePage = async (req, res, next) => {
  const value = validators.validate(req.query, validators.sites.managePage, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const {
    websites, accountBalance, dataForPayments, error, prices,
  } = await manage.getManagePage(value);
  if (error) return next(error);

  return res.status(200).json({
    websites, accountBalance, dataForPayments, prices,
  });
};

exports.report = async (req, res, next) => {
  const value = validators.validate(req.query, validators.sites.report, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const {
    payments, ownerAppNames, dataForPayments, error,
  } = await reports.getReport(value);
  if (error) return next(error);

  return res.status(200).json({ payments, ownerAppNames, dataForPayments });
};

exports.siteAuthorities = async (req, res, next) => {
  const value = validators.validate(req.query, validators.sites.authorities, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const { result, error } = await authorities.getSiteAuthorities(value, req.route.path.split('/')[2]);
  if (error) return next(error);

  return res.status(200).json(result);
};

exports.refundList = async (req, res, next) => {
  if (!req.query.userName) return next({ status: 422, message: 'userName is required' });

  const { error: authError } = await authoriseUser.authorise(req.query.userName);
  if (authError) return next(authError);

  const { result, error } = await refunds.refundsList(req.query.userName);
  if (error) return next(error);

  return res.status(200).json(result);
};

exports.getObjectFilters = async (req, res, next) => {
  const value = validators.validate(req.query, validators.sites.authorities, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const { result, error } = await objectsFilter.getObjectsFilter(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

exports.saveObjectFilters = async (req, res, next) => {
  const value = validators.validate(req.body, validators.sites.objectsFilter, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const { result, error } = await objectsFilter.saveObjectsFilter(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

exports.findTags = async (req, res, next) => {
  const value = validators.validate(req.query, validators.sites.searchTags, next);
  if (!value) return;

  const { result, error } = await sitesHelper.searchTags(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

exports.getMapData = async (req, res, next) => {
  const params = validators.validate(req.body, validators.sites.mapData, next);
  if (!params) return;

  const { result, error } = await map.getData({ ...params, app: req.appData });
  if (error) return next(error);

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.moderateObjects)
    .execute(result, req);

  return res.status(200).json(processedData);
};

exports.setMapCoordinates = async (req, res, next) => {
  const params = validators.validate(req.body, validators.sites.siteMapCoordinates, next);
  if (!params) return;

  const { error: authError } = await authoriseUser.authorise(params.userName);
  if (authError) return next(authError);

  const { result, error } = await mapCoordinates.set(params);
  if (error) return next(error);

  return res.status(200).json(result);
};

exports.getMapCoordinates = async (req, res, next) => {
  if (!req.query.host) return next({ status: 422, message: 'host is required' });

  const { result, error } = await mapCoordinates.get({ host: req.query.host });
  if (error) return next(error);

  return res.status(200).json(result);
};

exports.firstLoad = async (req, res, next) => {
  const { result, error } = await cachedFirstLoad({ app: req.appData })({
    key: `${REDIS_KEYS.API_RES_CACHE}:cachedFirstLoad:${req.appData.host}`,
    ttl: TTL_TIME.ONE_MINUTE,
  });
  if (error) return next(error);

  return res.status(200).json(result);
};

exports.getSettings = async (req, res, next) => {
  if (!req.query.host) return next({ status: 422, message: 'App host is required' });

  const { result, error } = await cachedGetSettings(req.query.host)({
    key: `${REDIS_KEYS.API_RES_CACHE}:cachedGetSettings:${req.query.host}`,
    ttl: TTL_TIME.ONE_MINUTE,
  });
  if (error) return next(error);

  return res.status(200).json(result);
};

exports.getRestrictions = async (req, res, next) => {
  const value = validators.validate(req.query, validators.sites.restrictions, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const { result, error } = await restrictions.get(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

exports.showAllPrefetches = async (req, res, next) => {
  const value = validators.validate(
    { ...req.query },
    validators.sites.showAllPrefetches,
    next,
  );
  if (!value) return;
  const { result, error } = await prefetchWobjs.showAllPrefetches(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

exports.getPrefetchesList = async (req, res, next) => {
  const value = validators.validate(
    { ...req.query },
    validators.sites.getPrefetchList,
    next,
  );
  if (!value) return;
  const { result, error } = await prefetchWobjs.getPrefetchList(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

exports.createPrefetch = async (req, res, next) => {
  const value = validators.validate(
    { ...req.body },
    validators.sites.createPrefetch,
    next,
  );
  if (!value) return;
  const { result, error } = await prefetchWobjs.createPrefetch(value);

  if (error) return next(error);

  return res.status(200).json(result);
};

exports.updatePrefetchesList = async (req, res, next) => {
  const value = validators.validate(
    { userName: req.headers.username, ...req.body },
    validators.sites.updatePrefetchList,
    next,
  );
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const { result, error } = await prefetchWobjs.updatePrefetchList(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

exports.getAffiliateList = async (req, res, next) => {
  const value = validators.validate(
    req.query,
    validators.sites.getAffiliateList,
    next,
  );
  if (!value) return;
  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const { result, error } = await affiliateShop.getAffiliateSites(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

exports.updateAffiliateList = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.sites.updateAffiliateList,
    next,
  );
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const { result, error } = await affiliateShop.updateAffiliateSites(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

exports.getAdSense = async (req, res, next) => {
  const value = validators.validate(
    req.query,
    validators.sites.getAdSenseSchema,
    next,
  );
  if (!value) return;

  const result = await cachedAdSense(value)({
    key: `${REDIS_KEYS.AD_SENSE}:${value.host}`,
    ttl: TTL_TIME.ONE_MINUTE,
  });

  return res.status(200).json(result);
};

exports.getParentHost = async (req, res, next) => {
  const value = validators.validate(
    req.query,
    validators.sites.getParentHostSchema,
    next,
  );
  if (!value) return;

  const result = await cachedParentHost(value)({
    key: `${REDIS_KEYS.API_RES_CACHE}:cachedParentHost:${value.host}`,
    ttl: TTL_TIME.ONE_DAY,
  });

  return res.status(200).json(result);
};

exports.getDescription = async (req, res, next) => {
  const result = await sitesHelper.getDescription({ app: req.appData });

  return res.status(200).json(result);
};

exports.updateAiStore = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.sites.updateAiSchema,
    next,
  );

  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);
  const { result, timeToNextRequest } = await updateAiCustomStore(value);

  return res.status(200).json({ result, timeToNextRequest });
};
