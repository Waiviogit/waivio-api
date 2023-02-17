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

  const { result, error } = await shop.getDepartmentFeed({
    ...value,
    app: req.appData,
    countryCode,
    user,
  });

  if (error) return next(error);
  res.json(result);
};

const getFilters = async (req, res, next) => {
  const { result, error } = await shop.getShopFilters();
  if (error) return next(error);
  res.json(result);
};

module.exports = {
  getDepartments,
  getFeed,
  getFilters,
  getFeedByDepartment,
};
