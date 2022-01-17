const Joi = require('@hapi/joi');
const { TRANSACTION_TYPES } = require('constants/hiveEngine');

const options = { allowUnknown: true, stripUnknown: true };

exports.depositWithdrawSchema = Joi.object().keys({
  userName: Joi.string().required(),
  type: Joi.string().valid(TRANSACTION_TYPES.DEPOSIT, TRANSACTION_TYPES.WITHDRAW).required(),
  from_coin: Joi.string().required(),
  to_coin: Joi.string().required(),
  destination: Joi.string().required(),
  pair: Joi.string().required(),
  ex_rate: Joi.number().required(),
  address: Joi.string(),
  account: Joi.string(),
  memo: Joi.string().allow('').required(),
  withdrawalAmount: Joi.when('type', {
    is: TRANSACTION_TYPES.WITHDRAW,
    then: Joi.number().required(),
    otherwise: Joi.forbidden(),
  }),
  trx_id: Joi.when('type', {
    is: TRANSACTION_TYPES.WITHDRAW,
    then: Joi.number().required(),
    otherwise: Joi.forbidden(),
  }),
}).xor('address', 'account').options(options);
