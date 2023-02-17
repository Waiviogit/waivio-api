const Joi = require('joi');

const options = { stripUnknown: true, convert: true };

exports.departmentsSchema = Joi.object().keys({
  name: Joi.string(),
  excluded: Joi.array().items(Joi.string()),
}).options(options);

exports.mainFeedSchema = Joi.object().keys({
  userName: Joi.string(),
  locale: Joi.string().default('en-US'),
  filter: Joi.object().keys({
    rating: Joi.number().min(0).max(10),
    tagCategory: Joi.array().items(Joi.object().keys({
      categoryName: Joi.string(),
      tags: Joi.array().items(Joi.string()),
    })),
  }),
}).options(options);

exports.departmentFeedSchema = Joi.object().keys({
  department: Joi.string().required(),
  userName: Joi.string(),
  locale: Joi.string().default('en-US'),
  filter: Joi.object().keys({
    rating: Joi.number().min(0).max(10),
    tagCategory: Joi.array().items(Joi.object().keys({
      categoryName: Joi.string(),
      tags: Joi.array().items(Joi.string()),
    })),
  }),
}).options(options);
