const Joi = require('joi');

exports.setWhiteList = Joi.object().keys({
  name: Joi.string().required(),
});

exports.createCredits = Joi.object().keys({
  userName: Joi.string().required(),
  amount: Joi.number().min(1).max(10000).required(),
});

exports.creditsView = Joi.object().keys({
  skip: Joi.number().min(0).default(0),
  limit: Joi.number().min(0).max(100).default(10),
});

exports.statisiticReportSchema = Joi.object().keys({
  host: Joi.string(),
  endDate: Joi.date().timestamp('unix').less('now'),
  startDate: Joi.when('endDate', {
    is: Joi.exist(),
    then: Joi.date().timestamp('unix').less(Joi.ref('endDate')),
    otherwise: Joi.date().timestamp('unix').less(new Date()),
  }),
  limit: Joi.number().min(0).default(20),
  skip: Joi.number().min(0).default(0),
});
