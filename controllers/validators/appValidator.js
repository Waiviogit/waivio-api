const Joi = require('@hapi/joi');

exports.experts = Joi.object().keys({
  name: Joi.string().required(),
  skip: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(0).default(10),
});

exports.hashtags = Joi.object().keys({
  name: Joi.string().required(),
  skip: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(0).default(30),
});
