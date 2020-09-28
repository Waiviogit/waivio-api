const validators = require('controllers/validators');
const { sites: { create } } = require('utilities/operations');

exports.create = async (req, res, next) => {

};

exports.availableCheck = async (req, res, next) => {
  const value = validators.validate(req.query, validators.sites.availableCheck, next);
  if (!value) return;

  const { result, error } = await create.availableCheck(value);

  if (error) {
    return next(error);
  }
  res.result = { status: 200, json: result };
  next();
};

exports.parentList = async (req, res, next) => {

};

exports.create = async (req, res, next) => {

};
