const Joi = require('joi');

exports.createOrUpdateSchema = Joi.object().keys({
  author: Joi.string().required(),
  permlink: Joi.string().required(),
  body: Joi.string().required(),
});

exports.getOneSchema = Joi.object().keys({
  author: Joi.string().required(),
  permlink: Joi.string().required(),
});
