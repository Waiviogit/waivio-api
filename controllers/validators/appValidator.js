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

exports.placesNearSchema = Joi.object().keys({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  includedTypes: Joi.array().items(Joi.string()).min(1),
  userName: Joi.string().required(),
});

exports.placesTextSchema = Joi.object().keys({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  includedType: Joi.string(),
  userName: Joi.string().required(),
  textQuery: Joi.string().required(),
});

exports.placesImageSchema = Joi.object().keys({
  placesUrl: Joi.string().required(),
  userName: Joi.string().required(),
});
