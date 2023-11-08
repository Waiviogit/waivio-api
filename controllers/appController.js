const { app: AppOperations } = require('utilities/operations');
const validators = require('controllers/validators');
const { getNamespace } = require('cls-hooked');
const { App } = require('models');
const config = require('config');
const redisGetter = require('utilities/redis/redisGetter');
const _ = require('lodash');
const { REDIS_KEYS } = require('../constants/common');

const show = async (req, res, next) => {
  const data = {
    name: req.params.appName || 'waiviodev',
  };
  data.bots = validators.apiKeyValidator.validateApiKey(req.headers['api-key']);
  const session = getNamespace('request-session');
  data.host = session.get('host') || config.appHost;
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

const getReqRates = async (req, res, next) => {
  const urls = await redisGetter.zrange({
    key: REDIS_KEYS.REQUESTS_BY_URL,
    start: 0,
    end: -1,
  });

  const timing = await redisGetter.zrange({
    key: REDIS_KEYS.REQUESTS_TIME,
    start: 0,
    end: -1,
  });

  const urlChunk = _.chunk(urls, 2);
  const timeChunk = _.chunk(timing, 2);

  const result = _.chain(urlChunk).map((el) => {
    const time = _.find(timeChunk, (t) => t[0] === el[0]);

    return {
      url: el[0],
      requestTimes: Number(el[1]),
      avgTime: Number(time[1]) / Number(el[1]),
    };
  })
    .orderBy(['requestTimes', 'avgTime'], ['desc', 'desc'])
    .value();

  res.result = {
    status: 200,
    json: result,
  };
  next();
};

module.exports = {
  show, experts, hashtags, getReqRates,
};
