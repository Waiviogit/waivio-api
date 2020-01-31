const validators = require('controllers/validators');
const { App } = require('models');
const { app: AppOperations } = require('utilities/operations');

const show = async (req, res, next) => {
  const data = {
    name: req.params.appName || 'waiviodev',
  };
  const { app, error } = await App.getOne(data);

  if (error) {
    return next(error);
  }
  res.status(200).json(app);
};

const experts = async (req, res, next) => {
  const value = validators.validate({
    name: req.params.appName,
    skip: req.query.skip,
    limit: req.query.limit,
  }, validators.app.experts, next);

  if (!value) return;

  const { users, error } = await AppOperations.experts(value);

  if (error) return next(error);
  res.status(200).json(users);
};

module.exports = { show, experts };
