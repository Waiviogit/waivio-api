const shop = require('utilities/operations/shop');
const {
  getCountryCodeFromIp,
  getIpFromHeaders,
} = require('utilities/helpers/sitesHelper');
const { User } = require('models');
const validators = require('./validators');

const getDepartments = async (req, res, next) => {
  const value = validators.validate(req.body, validators.shop.departmentsSchema, next);
  if (!value) return;
  const { result, error } = await shop.getShopDepartments(value);
  if (error) return next(error);
  res.json(result);
};

const getFeed = async (req, res, next) => {
  const value = validators.validate({
    ...req.body,
    ...req.headers,
  }, validators.shop.mainFeedSchema, next);
  if (!value) return;
  const countryCode = await getCountryCodeFromIp(getIpFromHeaders(req));

  const { result, error } = await shop.getShopFeed({
    ...value,
    app: req.appData,
    countryCode,
  });
  if (error) return next(error);
  res.json(result);
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
  res.json({ department, wobjects, hasMore });
};

const getFilters = async (req, res, next) => {
  const { result, error } = await shop.getShopFilters();
  if (error) return next(error);
  res.json(result);
};

const getUserDepartments = async (req, res, next) => {
  const value = validators.validate(req.body, validators.shop.userDepartmentsSchema, next);
  if (!value) return;
  const { result, error } = await shop.getUserDepartments.getTopDepartments(value);
  if (error) return next(error);
  res.json(result);
};

const getUserFeed = async (req, res, next) => {
  const value = validators.validate(
    { ...req.body, ...req.headers }, validators.shop.userFeedSchema, next,
  );
  if (!value) return;
  const countryCode = await getCountryCodeFromIp(getIpFromHeaders(req));

  const { result, error } = await shop.getUserFeed({
    ...value,
    app: req.appData,
    countryCode,
  });
  if (error) return next(error);
  res.json(result);
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
  res.json({ department, wobjects, hasMore });
};

const getUserFilters = async (req, res, next) => {
  const value = validators.validate(req.body, validators.shop.userFiltersSchema, next);
  if (!value) return;
  const { result, error } = await shop.userFilters.getUserFilters(value);
  if (error) return next(error);
  res.json(result);
};

const getUserTags = async (req, res, next) => {
  const value = validators.validate(req.body, validators.shop.userTagsSchema, next);
  if (!value) return;
  const { result, error } = await shop.userFilters.getMoreTagFilters(value);
  if (error) return next(error);
  res.json(result);
};

const getWobjectDepartments = async (req, res, next) => {
  const value = validators.validate(req.body, validators.shop.wobjectDepartmentsSchema, next);
  if (!value) return;
  const { result, error } = await shop.getWobjectDepartments({
    ...value,
    app: req.appData,
  });
  if (error) return next(error);
  res.json(result);
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
  res.json({ department, wobjects, hasMore });
};

const getWobjectMainFeed = async (req, res, next) => {
  const value = validators.validate(
    { ...req.body, ...req.headers }, validators.shop.wobjectFeedSchema, next,
  );
  if (!value) return;
  const countryCode = await getCountryCodeFromIp(getIpFromHeaders(req));

  const { result, error } = await shop.getWobjectMainFeed({
    ...value,
    app: req.appData,
    countryCode,
  });

  if (error) return next(error);
  res.json(result);
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
};
