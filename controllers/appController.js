const { app: AppOperations } = require('utilities/operations');
const getMetrics = require('utilities/operations/aboutWaiv/getMetrics');
const validators = require('controllers/validators');
const { App } = require('models');
const config = require('config');
const redisGetter = require('utilities/redis/redisGetter');
const _ = require('lodash');
const { REDIS_KEYS } = require('../constants/common');
const { getCurrentDateString } = require('../utilities/helpers/dateHelper');
const assitant = require('../utilities/operations/assistant/assitant');
const pipelineFunctions = require('../pipeline');
const RequestPipeline = require('../pipeline/requestPipeline');
const asyncLocalStorage = require('../middlewares/context/context');

const show = async (req, res, next) => {
  const data = {
    name: req.params.appName || 'waiviodev',
  };
  data.bots = validators.apiKeyValidator.validateApiKey(req.headers['api-key']);
  const store = asyncLocalStorage.getStore();

  data.host = store.get('host') || config.appHost;
  const {
    app,
    error,
  } = await App.getOne(data);

  if (error) {
    return next(error);
  }
  res.status(200)
    .json(app);
};

const experts = async (req, res, next) => {
  const value = validators.validate({
    name: req.params.appName,
    skip: req.query.skip,
    limit: req.query.limit,
  }, validators.app.experts, next);

  if (!value) return;

  const {
    users,
    error,
  } = await AppOperations.experts.get(value);

  if (error) return next(error);
  res.status(200)
    .json(users);
};

const hashtags = async (req, res, next) => {
  const value = validators.validate(
    { ...req.query, ...req.params },
    validators.app.hashtags,
    next,
  );
  if (!value) return;

  const {
    wobjects,
    hasMore,
    error,
  } = await AppOperations.hashtags(value);

  if (error) return next(error);

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.moderateObjects)
    .execute({ wobjects, hasMore }, req);

  return res.status(200).json(processedData);
};

const getReqRates = async (req, res, next) => {
  const key = req?.query?.key;

  if (key !== process.env.REQ_TIME_KEY) {
    res.status(401)
      .send();
    return;
  }
  const date = req?.query?.date || getCurrentDateString();

  try {
    const urls = await redisGetter.zrangeWithScores({
      key: `${REDIS_KEYS.REQUESTS_BY_URL}:${date}`,
      start: 0,
      end: -1,
    });

    const timing = await redisGetter.zrangeWithScores({
      key: `${REDIS_KEYS.REQUESTS_TIME}:${date}`,
      start: 0,
      end: -1,
    });

    const result = _.chain(urls)
      .map((el) => {
        const time = _.find(timing, (t) => t?.value === el?.value);

        if (el.value && el.score && time && time.value && time.score) {
          return {
            url: el.value,
            requestTimes: Number(el.score),
            avgTime: Number(time.score) / Number(el.score),
          };
        }

        return null; // Handle the case where data is missing
      })
      .filter((el) => el !== null) // Remove null values
      .orderBy(['requestTimes', 'avgTime'], ['desc', 'desc'])
      .value();

    res.result = {
      status: 200,
      json: result,
    };
  } catch (error) {
    // Handle any errors that occur during the asynchronous operations
    console.error(error);
    res.result = {
      status: 500,
      error: 'Internal Server Error',
    };
  }

  next();
};

const waivMainMetrics = async (req, res, next) => {
  const result = await getMetrics.getMainMetrics();

  res.status(200).json(result);
};

const swapHistory = async (req, res, next) => {
  const value = validators.validate(req.query, validators.app.swapHistory, next);

  if (!value) return;

  const result = await getMetrics.getSwapHistory(value);

  res.status(200).json(result);
};

const assistant = async (req, res, next) => {
  const value = validators.validate(req.body, validators.app.assistantScheme, next);

  if (!value) return;

  const { result, error } = await assitant.runWithEmbeddings(value);
  if (error) return next(error);

  res.status(200).json({ result });
};

const assistantHistory = async (req, res, next) => {
  const value = validators.validate(req.params, validators.app.assistantHistoryScheme, next);

  if (!value) return;

  const { result, error } = await assitant.getHistory(value);
  if (error) return next(error);

  res.status(200).json({ result });
};

module.exports = {
  show,
  experts,
  hashtags,
  getReqRates,
  waivMainMetrics,
  swapHistory,
  assistant,
  assistantHistory,
};
