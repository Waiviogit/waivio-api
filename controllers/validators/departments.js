const Joi = require('joi');
const { SHOP_SCHEMA } = require('../../constants/shop');

const options = { allowUnknown: true, stripUnknown: true, convert: true };

exports.departmentsSchema = Joi.object().keys({
  name: Joi.string(),
  names: Joi.array().items(Joi.string()),
  excluded: Joi.array().items(Joi.string()),
}).without('name', 'names').options(options);

exports.departmentsWobjectsSchema = Joi.object().keys({
  departments: Joi.array().items(Joi.string()).required(),
  schema: Joi.string().default(SHOP_SCHEMA.SHOP),
  skip: Joi.number().min(0).default(0),
  limit: Joi.number().min(1).default(10),
}).options(options);

exports.departmentsSearchSchema = Joi.object().keys({
  searchString: Joi.string().required(),
  skip: Joi.number().min(0).default(0),
  limit: Joi.number().min(1).default(10),
  userName: Joi.string().allow(''),
}).options(options);
