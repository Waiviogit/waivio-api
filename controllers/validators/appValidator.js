const Joi = require('joi');

exports.experts = Joi.object().keys({
  name: Joi.string().required(),
  skip: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(0).default(10),
});

exports.swapHistory = Joi.object().keys({
  skip: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(0).default(10),
});

exports.hashtags = Joi.object().keys({
  name: Joi.string().required(),
  skip: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(0).default(30),
});

exports.assistantScheme = Joi.object().keys({
  question: Joi.string().required(),
  id: Joi.string().required(),
});

exports.assistantHistoryScheme = Joi.object().keys({
  id: Joi.string().required(),
});
