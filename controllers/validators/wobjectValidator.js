const Joi = require('joi');
const { LANGUAGES } = require('utilities/constants');

exports.showSchema = Joi.object().keys({
  author_permlink: Joi.string().required(),
  locale: Joi.string(),
  user: Joi.string(),
  required_fields: Joi.array().items(Joi.string()).single(),
});

exports.indexSchema = Joi.object().keys({
  limit: Joi.number().integer().min(1).max(500)
    .default(30),
  skip: Joi.number().integer().min(0).default(0),
  user_limit: Joi.number().integer().min(0).max(100)
    .default(5),
  locale: Joi.string().default('en-US'),
  author_permlinks: Joi.array().items(Joi.string()),
  object_types: Joi.array().items(Joi.string()),
  exclude_object_types: Joi.array().items(Joi.string()),
  required_fields: Joi.array().items(Joi.string()).default([]),
  sample: Joi.boolean(),
  map: Joi.object().keys({
    coordinates: Joi.array().ordered([
      Joi.number().min(-90).max(90),
      Joi.number().min(-180).max(180),
    ]),
    radius: Joi.number().min(0),
  }),
});

exports.postsScheme = Joi.object().keys({
  author_permlink: Joi.string().required(),
  limit: Joi.number().integer().min(1).max(100)
    .default(30),
  skip: Joi.number().integer().min(0).default(0),
  user_languages: Joi.array().items(Joi.string().valid([...LANGUAGES])).default(['ru-RU']),
  forApp: Joi.string(),
});

exports.feedScheme = Joi.object().keys({
  limit: Joi.number().integer().min(1).max(100)
    .default(30),
  skip: Joi.number().integer().min(0).default(0),
  filter: Joi.object().keys({
    byApp: Joi.string(),
  }),
});

exports.followersScheme = Joi.object().keys({
  limit: Joi.number().integer().min(1).max(100)
    .default(30),
  skip: Joi.number().integer().min(0).default(0),
  author_permlink: Joi.string().required(),
});

exports.searchScheme = Joi.object().keys({
  limit: Joi.number().integer().min(1).max(100)
    .default(10),
  skip: Joi.number().integer().min(0).default(0),
  string: Joi.string().allow(''),
  locale: Joi.string().default('en-US'),
  sortByApp: Joi.string().allow('').default(null),
  object_type: Joi.string(),
  forParent: Joi.string().invalid('').allow(null),
  required_fields: Joi.array().items(Joi.string()).default([]),
});

// eslint-disable-next-line no-multi-assign
exports.fieldsScheme = exports.galleryScheme = exports.listScheme = Joi.object().keys({
  author_permlink: Joi.string().required(),
  fields_names: Joi.array().items(Joi.string()).default(null),
  custom_fields: Joi.object().default(null),
});

exports.objectExpertiseScheme = Joi.object().keys({
  limit: Joi.number().integer().min(1).max(100)
    .default(5),
  skip: Joi.number().integer().min(0).default(0),
  author_permlink: Joi.string().required(),
  user: Joi.string().allow('').default(null),
});

exports.getByFieldScheme = Joi.object().keys({
  fieldName: Joi.string().required(),
  fieldBody: Joi.string().required(),
});

exports.getChildWobjects = Joi.object().keys({
  limit: Joi.number().integer().min(1).max(100)
    .default(30),
  skip: Joi.number().integer().min(0).default(0),
  author_permlink: Joi.string().required(),
});
