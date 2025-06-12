const shop = require('../utilities/operations/shop');
const {
  getCountryCodeFromIp,
  getIpFromHeaders,
} = require('../utilities/helpers/sitesHelper');
const { User } = require('../models');
const validators = require('./validators');

const getDepartments = async (req, res, next) => {
  const value = validators.validate(req.body, validators.shop.departmentsSchema, next);
  if (!value) return;
  const { result, error } = await shop.getShopDepartments(value);
  if (error) return next(error);
  return res.json(result);
};

const getFeed = async (req, res, next) => {
  const value = validators.validate({
    ...req.body,
    ...req.headers,
  }, validators.shop.mainFeedSchema, next);
  if (!value) return;
  const countryCode = await getCountryCodeFromIp(getIpFromHeaders(req));

  const { result, hasMore, error } = await shop.getShopFeed({
    ...value,
    app: req.appData,
    countryCode,
  });
  if (error) return next(error);
  return res.json({ result, hasMore });
};

const getFeedByDepartment = async (req, res, next) => {
  const value = validators.validate({
    ...req.body,
    ...req.headers,
  }, validators.shop.departmentFeedSchema, next);
  if (!value) return;
  let user;
  if (value.userName) {
    ({ user } = await User.getOne(value.userName));
  }

  const countryCode = await getCountryCodeFromIp(getIpFromHeaders(req));

  const {
    department, wobjects, hasMore, error,
  } = await shop.getDepartmentFeed({
    ...value,
    app: req.appData,
    countryCode,
    user,
  });

  if (error) return next(error);
  return res.json({ department, wobjects, hasMore });
};

const getFilters = async (req, res, next) => {
  const value = validators.validate(req.body, validators.shop.mainFiltersSchema, next);
  if (!value) return;
  const { result, error } = await shop.getShopFilters.getFilters(value);
  if (error) return next(error);
  return res.json(result);
};

const getMoreTags = async (req, res, next) => {
  const value = validators.validate(req.body, validators.shop.tagsSchema, next);
  if (!value) return;
  const { result, error } = await shop.getShopFilters.getMoreTagFilters(value);
  if (error) return next(error);
  return res.json(result);
};

const getUserDepartments = async (req, res, next) => {
  const value = validators.validate(req.body, validators.shop.userDepartmentsSchema, next);
  if (!value) return;
  const { result, error } = await shop.getUserDepartments.getTopDepartments({
    ...value,
    app: req.appData,
  });
  if (error) return next(error);
  return res.json(result);
};

const getUserFeed = async (req, res, next) => {
  const value = validators.validate(
    { ...req.body, ...req.headers },
    validators.shop.userFeedSchema,
    next,
  );
  if (!value) return;
  const countryCode = await getCountryCodeFromIp(getIpFromHeaders(req));

  const { result, hasMore, error } = await shop.getUserFeed({
    ...value,
    app: req.appData,
    countryCode,
  });
  if (error) return next(error);
  return res.json({ result, hasMore });
};

const getUserFeedByDepartment = async (req, res, next) => {
  const value = validators.validate({
    ...req.body,
    ...req.headers,
  }, validators.shop.userFeedDepartmentsSchema, next);
  if (!value) return;

  const { user } = await User.getOne(value.follower);
  const countryCode = await getCountryCodeFromIp(getIpFromHeaders(req));

  const {
    department, wobjects, hasMore, error,
  } = await shop.getUserDepartmentFeed({
    ...value,
    app: req.appData,
    countryCode,
    user,
  });

  if (error) return next(error);
  return res.json({ department, wobjects, hasMore });
};

const getUserFilters = async (req, res, next) => {
  const value = validators.validate(req.body, validators.shop.userFiltersSchema, next);
  if (!value) return;
  const { result, error } = await shop.userFilters.getUserFilters({
    ...value,
    app: req.appData,
  });
  if (error) return next(error);
  return res.json(result);
};

const getUserTags = async (req, res, next) => {
  const value = validators.validate(req.body, validators.shop.userTagsSchema, next);
  if (!value) return;
  const { result, error } = await shop.userFilters.getMoreTagFilters({
    ...value,
    app: req.appData,
  });
  if (error) return next(error);
  return res.json(result);
};

const getWobjectDepartments = async (req, res, next) => {
  const value = validators.validate(req.body, validators.shop.wobjectDepartmentsSchema, next);
  if (!value) return;
  const { result, error } = await shop.getWobjectDepartments({
    ...value,
    app: req.appData,
  });
  if (error) return next(error);
  return res.json(result);
};

const getWobjectDepartmentFeed = async (req, res, next) => {
  const value = validators.validate({
    ...req.body,
    ...req.headers,
  }, validators.shop.wobjectFeedDepartmentsSchema, next);
  if (!value) return;

  const { user } = await User.getOne(value.follower);
  const countryCode = await getCountryCodeFromIp(getIpFromHeaders(req));

  const {
    department, wobjects, hasMore, error,
  } = await shop.getWobjectDepartmentFeed({
    ...value,
    app: req.appData,
    countryCode,
    user,
  });

  if (error) return next(error);
  return res.json({ department, wobjects, hasMore });
};

const getWobjectMainFeed = async (req, res, next) => {
  const value = validators.validate(
    { ...req.body, ...req.headers },
    validators.shop.wobjectFeedSchema,
    next,
  );
  if (!value) return;
  const countryCode = await getCountryCodeFromIp(getIpFromHeaders(req));

  const { result, hasMore, error } = await shop.getWobjectMainFeed({
    ...value,
    app: req.appData,
    countryCode,
  });

  if (error) return next(error);
  return res.json({ result, hasMore });
};

const restoreShopState = async (req, res, next) => {
  const value = validators.validate(req.body, validators.shop.restoreShopSchema, next);
  if (!value) return;

  const { result } = await shop.restoreShopState({
    ...value,
    app: req.appData,
  });

  return res.json(result);
};

const getWobjectFilters = async (req, res, next) => {
  const value = validators.validate(req.body, validators.shop.wobjectFiltersSchema, next);
  if (!value) return;
  const { result, error } = await shop.objectFilters.getObjectFilters({
    ...value,
    app: req.appData,
  });
  if (error) return next(error);
  return res.json(result);
};

const getWobjectTags = async (req, res, next) => {
  const value = validators.validate(req.body, validators.shop.wobjectTagsSchema, next);
  if (!value) return;
  const { result, error } = await shop.objectFilters.getMoreTagFilters({
    ...value,
    app: req.appData,
  });
  if (error) return next(error);
  return res.json(result);
};

const getAllReferences = async (req, res, next) => {
  const value = validators.validate(
    { ...req.body, userName: req.headers.follower },
    validators.shop.getAllReferencesSchema,
    next,
  );
  if (!value) return;
  const countryCode = await getCountryCodeFromIp(getIpFromHeaders(req));

  const { result, error } = await shop.getReference.getAll({
    ...value, app: req.appData, locale: req.headers.locale, countryCode,
  });
  if (error) return next(error);

  return res.status(200).json(result);
};

const getReferencesByType = async (req, res, next) => {
  const value = validators.validate(
    { ...req.body, userName: req.headers.follower },
    validators.shop.getReferencesByTypeScheme,
    next,
  );
  if (!value) return;
  const countryCode = await getCountryCodeFromIp(getIpFromHeaders(req));

  const { wobjects, hasMore, error } = await shop.getReference.getByType({
    ...value, app: req.appData, locale: req.headers.locale, countryCode,
  });
  if (error) return next(error);

  return res.status(200).json({ wobjects, hasMore });
};

const getRelated = async (req, res, next) => {
  const value = validators.validate(
    { ...req.body, userName: req.headers.follower },
    validators.shop.getRelatedSchema,
    next,
  );
  if (!value) return;
  const countryCode = await getCountryCodeFromIp(getIpFromHeaders(req));

  const { wobjects, hasMore, error } = await shop.getCloseProducts.getRelated({
    ...value, app: req.appData, locale: req.headers.locale, countryCode,
  });
  if (error) return next(error);

  return res.status(200).json({ wobjects, hasMore });
};

const getSimilar = async (req, res, next) => {
  const value = validators.validate(
    { ...req.body, userName: req.headers.follower },
    validators.shop.getSimilarSchema,
    next,
  );
  if (!value) return;
  const countryCode = await getCountryCodeFromIp(getIpFromHeaders(req));

  const { wobjects, hasMore, error } = await shop.getCloseProducts.getSimilar({
    ...value, app: req.appData, locale: req.headers.locale, countryCode,
  });
  if (error) return next(error);

  return res.status(200).json({ wobjects, hasMore });
};

const getAddon = async (req, res, next) => {
  const value = validators.validate(
    { ...req.body, userName: req.headers.follower },
    validators.shop.getAddOnSchema,
    next,
  );
  if (!value) return;
  const countryCode = await getCountryCodeFromIp(getIpFromHeaders(req));

  const { wobjects, hasMore, error } = await shop.getCloseProducts.getAddOn({
    ...value, app: req.appData, locale: req.headers.locale, countryCode,
  });
  if (error) return next(error);

  return res.status(200).json({ wobjects, hasMore });
};

module.exports = {
  getDepartments,
  getFeed,
  getFilters,
  getFeedByDepartment,
  getUserDepartments,
  getUserFeed,
  getUserFeedByDepartment,
  getWobjectDepartments,
  getWobjectDepartmentFeed,
  getWobjectMainFeed,
  getUserFilters,
  getUserTags,
  restoreShopState,
  getWobjectFilters,
  getWobjectTags,
  getMoreTags,
  getAllReferences,
  getReferencesByType,
  getRelated,
  getSimilar,
  getAddon,
};
