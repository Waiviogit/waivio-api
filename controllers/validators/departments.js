const Joi = require('joi');

const options = { allowUnknown: true, stripUnknown: true, convert: true };

exports.departmentsSchema = Joi.object().keys({
  name: Joi.string(),
  names: Joi.array().items(Joi.string()),
  excluded: Joi.array().items(Joi.string()),
}).without('name', 'names').options(options);

exports.departmentsWobjectsSchema = Joi.object().keys({
  departments: Joi.array().items(Joi.string()).required(),
  skip: Joi.number().min(0).default(0),
  limit: Joi.number().min(1).default(10),
}).options(options);

exports.departmentsSearchSchema = Joi.object().keys({
  searchString: Joi.string().required(),
  skip: Joi.number().min(0).default(0),
  limit: Joi.number().min(1).default(10),
  userName: Joi.string(),
}).options(options);
