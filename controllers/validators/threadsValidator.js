const Joi = require('joi');

exports.byHashtagSchema = Joi.object().keys({
  hashtag: Joi.string().required(),
  sort: Joi.string().valid('latest', 'oldest').default('latest'),
  skip: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).default(50),
});

exports.byUserSchema = Joi.object().keys({
  user: Joi.string().required(),
  sort: Joi.string().valid('latest', 'oldest').default('latest'),
  skip: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).default(50),
});

exports.hashtagCountSchema = Joi.object().keys({
  skip: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).default(50),
});
