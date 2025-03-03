const Joi = require('joi');

exports.setWhiteList = Joi.object().keys({
  name: Joi.string().required(),
});

exports.createCredits = Joi.object().keys({
  userName: Joi.string().required(),
  amount: Joi.number().min(1).max(1000).required(),
});
