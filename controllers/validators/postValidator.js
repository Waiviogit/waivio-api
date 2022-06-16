const { customValidationHelper } = require('utilities/helpers');
const { LANGUAGES } = require('constants/common');
const Joi = require('joi');

exports.showSchema = Joi.object().keys({
  author: Joi.string().required(),
  permlink: Joi.string().required(),
  userName: Joi.string().default(''),
});

exports.getPostsByCategorySchema = Joi.object().keys({
  category: Joi.string().valid('trending', 'created', 'hot').default('trending'),
  skip: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(0).max(50)
    .default(20),
  user_languages: Joi.array().items(Joi.string().valid(...LANGUAGES)).default(['en-US']),
  forApp: Joi.string().default('waivio'),
  lastId: Joi.string().custom(customValidationHelper.validateObjectId, 'Validate Mongoose ObjectId'),
  onlyCrypto: Joi.boolean().default(false),
  userName: Joi.string().default(''),
});

exports.getPostComments = Joi.object().keys({
  author: Joi.string().invalid('').required(),
  permlink: Joi.string().invalid('').required(),
  category: Joi.string().invalid('').required(),
  userName: Joi.string().default(''),
});

exports.getManyPosts = Joi.array().items(Joi.object().keys({
  author: Joi.string().required(),
  permlink: Joi.string().required(),
}));

exports.likePost = Joi.object().keys({
  author: Joi.string().invalid('').required(),
  permlink: Joi.string().invalid('').required(),
  voter: Joi.string().invalid('').required(),
  weight: Joi.number()
    .integer()
    .min(-10000)
    .max(10000)
    .required(),
});
