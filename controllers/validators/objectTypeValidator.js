const Joi = require('joi');
const { OBJECT_TYPE_TOP_WOBJECTS_COUNT, OBJECT_TYPE_TOP_EXPERTS_COUNT } = require('../../constants/wobjectsData');

exports.indexSchema = Joi.object().keys({
  limit: Joi.number().integer().min(0),
  skip: Joi.number().integer().min(0).default(0),
  wobjects_count: Joi.number().integer().min(0).max(OBJECT_TYPE_TOP_WOBJECTS_COUNT)
    .default(0),
});

exports.showSchema = Joi.object().keys({
  userName: Joi.string(),
  appName: Joi.string(),
  name: Joi.string().required(),
  simplified: Joi.boolean().default(false),
  wobjLimit: Joi.number().integer().min(0).default(30),
  wobjSkip: Joi.number().integer().min(0).default(0),
  sort: Joi.string().valid('weight', 'proximity').default('weight'),
  filter: Joi.object({
    map: Joi.object().keys({
      coordinates: Joi
        .array()
        .ordered(
          Joi.number().min(-90).max(90),
          Joi.number().min(-180).max(180),
        ),
      radius: Joi.number().min(0),
    }),
    searchString: Joi.string().invalid(''),
    tagCategory: Joi.array().items(Joi.object().keys({
      categoryName: Joi.string().required(),
      tags: Joi.array().items(Joi.string()).min(1).required(),
    })),
  }).pattern(/.+/, Joi.array().items(Joi.string())),
});

exports.expertsSchema = Joi.object().keys({
  name: Joi.string().required(),
  limit: Joi.number().integer().min(0).max(OBJECT_TYPE_TOP_EXPERTS_COUNT)
    .default(5),
  skip: Joi.number().integer().min(0).max(OBJECT_TYPE_TOP_EXPERTS_COUNT - 1)
    .default(0),
});

exports.showMoreTagsSchema = Joi.object().keys({
  objectType: Joi.string().required(),
  tagCategory: Joi.string().required(),
  limit: Joi.number().integer().min(0).default(10),
  skip: Joi.number().integer().min(0).default(0),
});

exports.tagsForFilterSchema = Joi.object().keys({
  objectType: Joi.string().required(),
  wobjectLinks: Joi.array().items(Joi.string()).default([]),
});

exports.tagCategoriesSchema = Joi.object().keys({
  objectType: Joi.string().required(),
  tagsLimit: Joi.number().integer().min(1).max(100)
    .default(3),
});

exports.categoryTagsSchema = Joi.object().keys({
  objectType: Joi.string().required(),
  tagCategory: Joi.string().required(),
  skip: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100)
    .default(10),
});
