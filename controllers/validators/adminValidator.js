const Joi = require('joi');

exports.setWhiteList = Joi.object().keys({
  name: Joi.string().required(),
});
