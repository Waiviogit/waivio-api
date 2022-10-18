const Joi = require('joi');

const options = { allowUnknown: true, stripUnknown: true, convert: true };

exports.departmentsSchema = Joi.object().keys({
  name: Joi.string().lowercase(),
  names: Joi.array().items(Joi.string().lowercase()),
  excluded: Joi.array().items(Joi.string().lowercase()),
}).without('name', 'names').options(options);
