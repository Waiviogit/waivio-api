const whiteList = require('../utilities/operations/admin/whiteList');
const vipTickets = require('../utilities/operations/admin/vipTickets');
const sites = require('../utilities/operations/admin/sites');
const credits = require('../utilities/operations/admin/credits');
const authoriseUser = require('../utilities/authorization/authoriseUser');
const validators = require('./validators');
const { WAIVIO_ADMINS_ENV } = require('../constants/common');

const getWhitelist = async (req, res, next) => {
  const { admin } = req.headers;

  const { error: authError } = await authoriseUser.authorise(admin);
  if (authError) return next(authError);
  const { error } = await authoriseUser.checkAdmin(admin);
  if (error) return next(error);
  const { result } = await whiteList.getWhiteList();

  return res.status(200).json({ result });
};

const setWhitelist = async (req, res, next) => {
  const value = validators.validate(req.body, validators.admin.setWhiteList, next);

  if (!value) return;
  const { admin } = req.headers;

  const { error: authError } = await authoriseUser.authorise(admin);
  if (authError) return next(authError);
  const { error } = await authoriseUser.checkAdmin(admin);
  if (error) return next(error);

  const { result, error: errorAdd } = await whiteList.addWhiteList(value);
  if (errorAdd) return next(errorAdd);

  return res.status(200).json({ result });
};

const deleteWhitelist = async (req, res, next) => {
  const value = validators.validate(req.body, validators.admin.setWhiteList, next);

  if (!value) return;
  const { admin } = req.headers;
  const { error: authError } = await authoriseUser.authorise(admin);
  if (authError) return next(authError);
  const { error } = await authoriseUser.checkAdmin(admin);
  if (error) return next(error);

  const { result } = await whiteList.deleteWhiteList(value);

  return res.status(200).json({ result });
};

const getVipTickets = async (req, res, next) => {
  const { admin } = req.headers;
  const { error: authError } = await authoriseUser.authorise(admin);
  if (authError) return next(authError);
  const { error } = await authoriseUser.checkAdmin(admin);
  if (error) return next(error);

  const result = await vipTickets.getVipTickets();

  return res.status(200).json(result);
};

const manageView = async (req, res, next) => {
  const { admin } = req.headers;
  const { error: authError } = await authoriseUser.authorise(admin);
  if (authError) return next(authError);
  const { error } = await authoriseUser.checkAdmin(admin);
  if (error) return next(error);

  const result = await sites.manageView();

  return res.status(200).json(result);
};

const getAdmins = async (req, res, next) => res.status(200).json(WAIVIO_ADMINS_ENV);

const createCredits = async (req, res, next) => {
  const value = validators.validate(req.body, validators.admin.createCredits, next);

  if (!value) return;
  const { admin } = req.headers;
  const { error: authError } = await authoriseUser.authorise(admin);

  if (authError) return next(authError);
  const { result, error } = await credits.createCreditsUser({ ...value, admin });

  if (error) return next(error);
  return res.status(200).json({ result });
};

module.exports = {
  getWhitelist,
  setWhitelist,
  deleteWhitelist,
  getVipTickets,
  manageView,
  getAdmins,
  createCredits,
};
