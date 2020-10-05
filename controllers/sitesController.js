const validators = require('controllers/validators');
const authoriseUser = require('utilities/authorization/authoriseUser');
const { sitesHelper } = require('utilities/helpers');
const {
  sites: {
    objectsFilter, refunds, authorities, reports, manage, create, configurations,
  },
} = require('utilities/operations');

exports.create = async (req, res, next) => {
  const value = validators.validate(req.body, validators.sites.createApp, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.owner);
  if (authError) return next(authError);

  const { result, error } = await create.createApp(value);
  if (error) return next(error);

  res.result = { status: 200, json: { result } };
  next();
};

exports.availableCheck = async (req, res, next) => {
  const value = validators.validate(req.query, validators.sites.availableCheck, next);
  if (!value) return;

  const { result, error } = await sitesHelper.availableCheck(value);
  if (error) return next(error);

  res.result = { status: 200, json: { result } };
  next();
};

exports.parentList = async (req, res, next) => {
  const { parents, error } = await sitesHelper.getParentsList();
  if (error) return next(error);

  res.result = { status: 200, json: parents };
  next();
};

exports.getUserApps = async (req, res, next) => {
  const value = validators.validate(req.query, validators.sites.getApps, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const { result, error } = await sitesHelper.getUserApps(value);
  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};

exports.configurationsList = async (req, res, next) => {
  if (!req.query.host) return next({ status: 422, message: 'App host is required' });

  const { result, error } = await configurations.getConfigurationsList(req.query.host);
  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};

exports.saveConfigurations = async (req, res, next) => {
  const value = validators.validate(req.query, validators.sites.saveConfigurations, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const { result, error } = await configurations.saveConfigurations(value);
  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};

exports.managePage = async (req, res, next) => {
  const value = validators.validate(req.query, validators.sites.managePage, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const {
    websites, accountBalance, dataForPayments, error,
  } = await manage.getManagePage(value);
  if (error) return next(error);

  res.result = {
    status: 200, json: { websites, accountBalance, dataForPayments },
  };
  next();
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

  res.result = {
    status: 200, json: { payments, ownerAppNames, dataForPayments },
  };
  next();
};

exports.siteAuthorities = async (req, res, next) => {
  const value = validators.validate(req.query, validators.sites.authorities, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const { result, error } = await authorities.getSiteAuthorities(value, req.route.path.split('/')[2]);
  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};

exports.refundList = async (req, res, next) => {
  if (!req.query.userName) return next({ status: 422, message: 'userName is required' });

  const { error: authError } = await authoriseUser.authorise(req.query.userName);
  if (authError) return next(authError);

  const { result, error } = await refunds.refundsList(req.query.userName);
  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};

exports.getObjectFilters = async (req, res, next) => {
  const value = validators.validate(req.query, validators.sites.authorities, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const { result, error } = await objectsFilter.getObjectsFilter(value);
  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};

exports.saveObjectFilters = async (req, res, next) => {
  const value = validators.validate(req.body, validators.sites.objectsFilter, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const { result, error } = await objectsFilter.saveObjectsFilter(value);
  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};

exports.findTags = async (req, res, next) => {
  const value = validators.validate(req.query, validators.sites.searchTags, next);
  if (!value) return;

  const { result, error } = await sitesHelper.searchTags(value);
  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};
