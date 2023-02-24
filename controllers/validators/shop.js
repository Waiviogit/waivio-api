const Joi = require('joi');

const options = { stripUnknown: true, convert: true };

exports.departmentsSchema = Joi.object().keys({
  name: Joi.string(),
  excluded: Joi.array().items(Joi.string()),
}).options(options);

exports.userDepartmentsSchema = Joi.object().keys({
  userName: Joi.string().required(),
  skip: Joi.number().default(0),
  limit: Joi.number().default(10),
}).options(options);

exports.wobjectDepartmentsSchema = Joi.object().keys({
  authorPermlink: Joi.string().required(),
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
  skip: Joi.number().default(0),
  limit: Joi.number().default(10),
}).options(options);

exports.userFeedSchema = Joi.object().keys({
  userName: Joi.required(),
  locale: Joi.string().default('en-US'),
  follower: Joi.string(),
  filter: Joi.object().keys({
    rating: Joi.number().min(0).max(10),
    tagCategory: Joi.array().items(Joi.object().keys({
      categoryName: Joi.string(),
      tags: Joi.array().items(Joi.string()),
    })),
  }),
}).options(options);

exports.userFeedDepartmentsSchema = Joi.object().keys({
  department: Joi.string().required(),
  userName: Joi.string().required(),
  follower: Joi.string(),
  locale: Joi.string().default('en-US'),
  filter: Joi.object().keys({
    rating: Joi.number().min(0).max(10),
    tagCategory: Joi.array().items(Joi.object().keys({
      categoryName: Joi.string(),
      tags: Joi.array().items(Joi.string()),
    })),
  }),
  skip: Joi.number().default(0),
  limit: Joi.number().default(10),
}).options(options);

exports.wobjectFeedSchema = Joi.object().keys({
  authorPermlink: Joi.required(),
  locale: Joi.string().default('en-US'),
  follower: Joi.string(),
}).options(options);

exports.wobjectFeedDepartmentsSchema = Joi.object().keys({
  department: Joi.string().required(),
  authorPermlink: Joi.required(),
  follower: Joi.string(),
  locale: Joi.string().default('en-US'),
  skip: Joi.number().default(0),
  limit: Joi.number().default(10),
}).options(options);
