const axios = require('axios');

exports.accountHistory = async (params) => {
  try {
    return await axios.get('https://accounts.hive-engine.com/accountHistory', { params });
  } catch (error) {
    return error;
  }
};


// account: Joi.string().required(),
//     skip: Joi.number().default(0),
//     limit: Joi.number().default(10),
//     showRewards: Joi.boolean().default(false),
//     excludeSymbols: Joi.array().items(Joi.string()),
//     symbol: Joi.string()
//     .when('excludeSymbols', { not: Joi.exist(), then: Joi.required() }),
//     timestampEnd: Joi.number().default(0),
//     lastId: Joi.string().when('timestampEnd', { not: 0, then: Joi.required() }),


const constructApiQuery = ({
  params, limit, timestampEnd,
}) => ({
  ...(params.timestampEnd && { timestampEnd: params.timestampEnd, timestampStart: 1 }),
  ...(params.symbol && { symbol: params.symbol }),
  account: params.account,
  ops: !params.showRewards ? HISTORY_API_OPS.toString()
      : [...HISTORY_API_OPS, ...Object.values(HISTORY_OPERATION_TYPES)].toString(),
  limit,
  ...(timestampEnd && { timestampStart: timestampEnd, timestampEnd: moment().unix() }),
});
