const whiteList = require('../utilities/operations/admin/whiteList');
const vipTickets = require('../utilities/operations/admin/vipTickets');
const sitesStatistic = require('../utilities/operations/sites/sitesStatistic');
const sites = require('../utilities/operations/admin/sites');
const credits = require('../utilities/operations/admin/credits');
const guests = require('../utilities/operations/admin/guests');
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

const subscriptionsView = async (req, res, next) => {
  const { admin } = req.headers;
  const { error: authError } = await authoriseUser.authorise(admin);
  if (authError) return next(authError);
  const { error } = await authoriseUser.checkAdmin(admin);
  if (error) return next(error);

  const result = await sites.subscriptionView();

  return res.status(200).json(result);
};

const getAdmins = async (req, res, next) => res.status(200).json(WAIVIO_ADMINS_ENV);

const createCredits = async (req, res, next) => {
  const value = validators.validate(req.body, validators.admin.createCredits, next);

  if (!value) return;
  const { admin } = req.headers;
  const { error: adminError } = await authoriseUser.checkAdmin(admin);
  if (adminError) return next(adminError);

  const { error: authError } = await authoriseUser.authorise(admin);
  if (authError) return next(authError);
  const { result, error } = await credits.createCreditsUser({ ...value, admin });

  if (error) return next(error);
  return res.status(200).json({ result });
};

const creditsView = async (req, res, next) => {
  const value = validators.validate(req.query, validators.admin.creditsView, next);
  const { admin } = req.headers;
  const { error: authError } = await authoriseUser.authorise(admin);
  if (authError) return next(authError);
  const { error } = await authoriseUser.checkAdmin(admin);
  if (error) return next(error);

  const result = await sites.creditsView(value);

  return res.status(200).json(result);
};

const statisticReportAdmin = async (req, res, next) => {
  const value = validators.validate(req.body, validators.admin.statisiticReportSchema, next);
  const { admin } = req.headers;

  const { error: authError } = await authoriseUser.authorise(admin);
  if (authError) return next(authError);
  const { error } = await authoriseUser.checkAdmin(admin);
  if (error) return next(error);

  const { result, hasMore, error: dbError } = await sitesStatistic.getStatisticReportAdmin(value);
  if (dbError) return next(dbError);
  return res.status(200).json({ result, hasMore });
};

const getGuestUsers = async (req, res, next) => {
  const value = validators.validate(req.body, validators.admin.getGuestUsersSchema, next);
  if (!value) return;
  const { admin } = req.headers;
  const { error: adminError } = await authoriseUser.checkAdmin(admin);
  if (adminError) return next(adminError);

  const { error: authError } = await authoriseUser.authorise(admin);
  if (authError) return next(authError);
  const { result, hasMore, error } = await guests.getGuestUsersList(value);

  if (error) return next(error);
  return res.status(200).json({ result, hasMore });
};

const getGuestUsersSpam = async (req, res, next) => {
  const value = validators.validate(req.body, validators.admin.getGuestUsersSchema, next);
  if (!value) return;
  const { admin } = req.headers;
  const { error: adminError } = await authoriseUser.checkAdmin(admin);
  if (adminError) return next(adminError);

  const { error: authError } = await authoriseUser.authorise(admin);
  if (authError) return next(authError);
  const { result, hasMore, error } = await guests.getGuestUsersList({
    ...value,
    spamDetected: true,
  });

  if (error) return next(error);
  return res.status(200).json({ result, hasMore });
};

const blockGuest = async (req, res, next) => {
  const value = validators.validate(req.body, validators.admin.blockGuestUsersSchema, next);
  if (!value) return;
  const { admin } = req.headers;
  const { error: adminError } = await authoriseUser.checkAdmin(admin);
  if (adminError) return next(adminError);

  const { error: authError } = await authoriseUser.authorise(admin);
  if (authError) return next(authError);
  const { result, error } = await guests.blockGuestUser(value);

  if (error) return next(error);
  return res.status(200).json({ result });
};

const getGuestUsersSpamList = async (req, res, next) => {
  const value = validators.validate(
    { ...req.body, ...req.params },
    validators.admin.getGuestUserSpamSchema,
    next,
  );
  if (!value) return;
  const { admin } = req.headers;
  const { error: adminError } = await authoriseUser.checkAdmin(admin);
  if (adminError) return next(adminError);

  const { error: authError } = await authoriseUser.authorise(admin);
  if (authError) return next(authError);
  const { result, hasMore, error } = await guests.getSpamDetectionsByUserName(value);

  if (error) return next(error);
  return res.status(200).json({ result, hasMore });
};

module.exports = {
  getWhitelist,
  setWhitelist,
  deleteWhitelist,
  getVipTickets,
  manageView,
  getAdmins,
  createCredits,
  subscriptionsView,
  creditsView,
  statisticReportAdmin,
  getGuestUsers,
  getGuestUsersSpam,
  blockGuest,
  getGuestUsersSpamList,
};
