const Joi = require('joi');

exports.setWhiteList = Joi.object().keys({
  name: Joi.string().required(),
});

exports.createCredits = Joi.object().keys({
  userName: Joi.string().required(),
  amount: Joi.number().min(1).max(10000).required(),
});

exports.creditsView = Joi.object().keys({
  skip: Joi.number().min(0).default(0),
  limit: Joi.number().min(0).max(100).default(10),
});
