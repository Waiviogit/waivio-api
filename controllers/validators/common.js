const Joi = require('joi');

const boxScheme = Joi.object().keys({
  topPoint: Joi
    .array()
    .ordered(
      Joi.number().min(-180).max(180),
      Joi.number().min(-90).max(90),
    ).required(),
  bottomPoint: Joi
    .array()
    .ordered(
      Joi.number().min(-180).max(180),
      Joi.number().min(-90).max(90),
    ).required(),
});

module.exports = {
  boxScheme,
};
