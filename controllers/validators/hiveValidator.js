const Joi = require('joi');
const { BLOCK_NUM_KEYS } = require('../../constants/common');

const options = { allowUnknown: true, stripUnknown: true };

exports.getBlockNum = Joi.object().keys({
  key: Joi.string().valid(...Object.values(BLOCK_NUM_KEYS)).required(),
}).options(options);
