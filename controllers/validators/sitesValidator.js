const Joi = require('@hapi/joi');

exports.availableCheck = Joi.object().keys({
  name: Joi.string().regex(/[a-z,0-9]+$\b/).required(),
  parent: Joi.string().required(),
});
