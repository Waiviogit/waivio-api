const whiteList = require('utilities/operations/admin/whiteList');
const authoriseUser = require('utilities/authorization/authoriseUser');
const validators = require('./validators');

const getWhitelist = async (req, res, next) => {
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

  const { result } = await whiteList.addWhiteList(value);

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

module.exports = {
  getWhitelist,
  setWhitelist,
  deleteWhitelist,
};
