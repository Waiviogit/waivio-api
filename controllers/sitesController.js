const validators = require('controllers/validators');
const authoriseUser = require('utilities/authorization/authoriseUser');
const { sitesHelper } = require('utilities/helpers');

exports.create = async (req, res, next) => {
  const value = validators.validate(req.body, validators.sites.createApp, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.owner);
  if (authError) return next(authError);

  const { result, error } = await sitesHelper.createApp(value);
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

  const { result, error } = await sitesHelper.getConfigurationsList(req.query.host);
  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};

exports.managePage = async (req, res, next) => {
  const value = validators.validate(req.query, validators.sites.getApps, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const {
    websites, accountBalance, dataForPayments, error,
  } = await sitesHelper.getManagePageData(value);
  if (error) return next(error);

  res.result = {
    status: 200, json: { websites, accountBalance, dataForPayments },
  };
  next();
};
