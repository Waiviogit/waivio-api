const Joi = require('@hapi/joi');
const { SITE_NAME_REGEX } = require('constants/sitesConstants');

const options = { allowUnknown: true, stripUnknown: true };

exports.availableCheck = Joi.object().keys({
  name: Joi.string().pattern(SITE_NAME_REGEX).invalid('www').min(3)
    .required(),
  parentId: Joi.string().required(),
}).options(options);

exports.getApps = Joi.object().keys({
  userName: Joi.string().required(),
}).options(options);

exports.createApp = Joi.object().keys({
  owner: Joi.string().required(),
  name: Joi.string().regex(/[a-z,0-9]+$\b/).required(),
  parentId: Joi.string().required(),
}).options(options);

exports.managePage = Joi.object().keys({
  userName: Joi.string().required(),
}).options(options);

exports.report = Joi.object().keys({
  endDate: Joi.date().timestamp('unix').less('now'),
  startDate: Joi.when('endDate', {
    is: Joi.exist(),
    then: Joi.date().timestamp('unix').less(Joi.ref('endDate')),
    otherwise: Joi.date().timestamp('unix').less(new Date()),
  }),
  userName: Joi.string().required(),
  host: Joi.string(),
}).options(options);

exports.authorities = Joi.object().keys({
  userName: Joi.string().required(),
  host: Joi.string().required(),
}).options(options);
