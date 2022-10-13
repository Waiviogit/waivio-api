const Joi = require('joi');

const options = { allowUnknown: true, stripUnknown: true };

exports.departmentsSchema = Joi.object().keys({
  name: Joi.string(),
  names: Joi.array().items(Joi.string()),
  excluded: Joi.array().items(Joi.string()),
}).without('name', 'names').options(options);
