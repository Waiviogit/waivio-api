const validators = require('./validators');
const threads = require('../utilities/operations/threads');

const byHashtag = async (req, res, next) => {
  const value = validators.validate(req.query, validators.threads.byHashtagSchema, next);
  if (!value) return;
  const { result, error } = await threads.getThreads.byHashtag(value);
  if (error) return next(error);
  res.json(result);
};

const byUser = async (req, res, next) => {
  const value = validators.validate(req.query, validators.threads.byUserSchema, next);
  if (!value) return;
  const { result, error } = await threads.getThreads.byUser(value);
  if (error) return next(error);
  res.json(result);
};

const hashtagsCount = async (req, res, next) => {
  const value = validators.validate(req.query, validators.threads.hashtagCountSchema, next);
  if (!value) return;
  const { result, error } = await threads.getHashtags.getTrendingHashTagsWithCount(value);
  if (error) return next(error);
  res.json(result);
};

module.exports = {
  byHashtag,
  byUser,
  hashtagsCount,
};
