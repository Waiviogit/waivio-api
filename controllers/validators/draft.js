const Joi = require('joi');

exports.createOrUpdatePageDraftSchema = Joi.object().keys({
  user: Joi.string().required(),
  authorPermlink: Joi.string().required(),
  body: Joi.string().allow('').default(''),
});

exports.getOnePageDraftSchema = Joi.object().keys({
  user: Joi.string().required(),
  authorPermlink: Joi.string().required(),
});

exports.updateDraftSchema = Joi.object().keys({
  _id: Joi.string(),
  draftId: Joi.string(),
  title: Joi.string(),
  author: Joi.string(),
  beneficiary: Joi.boolean().default(false),
  isUpdating: Joi.boolean(),
  upvote: Joi.boolean().optional(),
  body: Joi.string(),
  originalBody: Joi.string(),
  jsonMetadata: Joi.object(),
  lastUpdated: Joi.number(),
  parentAuthor: Joi.string().allow(''),
  parentPermlink: Joi.string(),
  permlink: Joi.string(),
  reward: Joi.string().optional(),
  campaignType: Joi.string().optional(),
});

exports.createOrUpdateCommentDraftSchema = Joi.object().keys({
  user: Joi.string().required(),
  author: Joi.string().required(),
  permlink: Joi.string().required(),
  body: Joi.string().allow('').default(''),
});

exports.getOneCommentDraftSchema = Joi.object().keys({
  user: Joi.string().required(),
  author: Joi.string().required(),
  permlink: Joi.string().required(),
});

exports.getOnePostDraftSchema = Joi.object().keys({
  author: Joi.string().required(),
  draftId: Joi.string().required(),
});

exports.getPostDraftsSchema = Joi.object().keys({
  author: Joi.string().required(),
  limit: Joi.number().integer().min(0).default(20),
  skip: Joi.number().integer().min(0).default(0),
});

exports.deletePostDraftSchema = Joi.object().keys({
  author: Joi.string().required(),
  ids: Joi.array().items(Joi.string()).min(1).required(),
});
