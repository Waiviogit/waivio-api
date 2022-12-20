const Joi = require('joi');

const options = { allowUnknown: true, stripUnknown: true, convert: true };

exports.departmentsSchema = Joi.object().keys({
  name: Joi.string().lowercase(),
  names: Joi.array().items(Joi.string().lowercase()),
  excluded: Joi.array().items(Joi.string().lowercase()),
}).without('name', 'names').options(options);

exports.departmentsWobjectsSchema = Joi.object().keys({
  departments: Joi.array().items(Joi.string().lowercase()).required(),
  skip: Joi.number().min(0).default(0),
  limit: Joi.number().min(1).default(10),
}).options(options);
