const Joi = require('@hapi/joi');
const { LANGUAGES } = require('utilities/constants');
const { ObjectId } = require('mongoose').Types;

exports.showSchema = Joi.object().keys({
  author: Joi.string().required(),
  permlink: Joi.string().required(),
});

exports.getPostsByCategorySchema = Joi.object().keys({
  category: Joi.string().valid('trending', 'created', 'hot').default('trending'),
  skip: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(0).max(50)
    .default(20),
  user_languages: Joi.array().items(Joi.string().valid(...LANGUAGES)).default(['ru-RU']),
  forApp: Joi.string(),
  lastId: Joi.string().custom(validateObjectId, 'Validate Mongoose ObjectId'),
});

exports.getPostComments = Joi.object().keys({
  author: Joi.string().invalid('').required(),
  permlink: Joi.string().invalid('').required(),
  category: Joi.string().invalid('').required(),
});

exports.getManyPosts = Joi.array().items(Joi.object().keys({
  author: Joi.string().required(),
  permlink: Joi.string().required(),
}));

function validateObjectId(value, helpers) {
  return ObjectId.isValid(value) ? value : helpers.error('any.custom');
}
