const {
  hive: {
    getCachedCurrency,
  },
} = require('utilities/operations');
const validators = require('controllers/validators');

exports.getRewardFund = async (req, res, next) => {
  const { result, error } = await getCachedCurrency.getRewardFund();
  if (error) return next(error);
  res.result = { status: 200, json: result };
  next();
};

exports.getCurrentMedianHistory = async (req, res, next) => {
  const { result, error } = await getCachedCurrency.getCurrentMedianHistory();
  if (error) return next(error);
  res.result = { status: 200, json: result };
  next();
};

exports.getBlockNum = async (req, res, next) => {
  const value = validators.validate(req.query, validators.hive.getBlockNum, next);
  if (!value) return;
  const { blockNum, error } = await getCachedCurrency.getBlockNum(value);
  if (error) return next(error);
  res.result = { status: 200, json: { blockNum } };
  next();
};

exports.getGlobalProperties = async (req, res, next) => {
  const { result, error } = await getCachedCurrency.getGlobalProperties();
  if (error) return next(error);
  res.result = { status: 200, json: result };
  next();
};
