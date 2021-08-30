const Joi = require('@hapi/joi');

exports.customJoi = Joi.extend((joi) => ({
  base: joi.array(),
  type: 'stringArray',
  coerce: (value) => ({
    value: value.split ? value.split(',') : value,
  }),
}));
