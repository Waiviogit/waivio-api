const Joi = require('joi');

const options = { allowUnknown: true, stripUnknown: true };

exports.getTicketsSchema = Joi.object().keys({
  userName: Joi.string().required(),
  activeSkip: Joi.number().integer().min(0).default(0),
  consumedSkip: Joi.number().integer().min(0).default(0),
  activeLimit: Joi.number().integer().min(0).max(100)
    .default(10),
  consumedLimit: Joi.number().integer().min(0).max(100)
    .default(10),
}).options(options);

exports.addNoteSchema = Joi.object().keys({
  userName: Joi.string().required(),
  ticket: Joi.string().required(),
  note: Joi.string().required().allow(''),
}).options(options);
