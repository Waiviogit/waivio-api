const validators = require('controllers/validators');
const { getNamespace } = require('cls-hooked');
const { App } = require('models');
const { app: AppOperations } = require('utilities/operations');

const show = async (req, res, next) => {
  const data = {
    name: req.params.appName || 'waiviodev',
  };
  data.bots = validators.apiKeyValidator.validateApiKey(req.headers['api-key']);
  const session = getNamespace('request-session');
  data.host = session.get('host');
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

  const { users, error } = await AppOperations.experts.get(value);

  if (error) return next(error);
  res.status(200).json(users);
};

const hashtags = async (req, res, next) => {
  const value = validators.validate(
    { ...req.query, ...req.params },
    validators.app.hashtags,
    next,
  );
  if (!value) return;

  const { wobjects, hasMore, error } = await AppOperations.hashtags(value);

  if (error) return next(error);
  res.result = { status: 200, json: { wobjects, hasMore } };
  next();
};

module.exports = { show, experts, hashtags };
