const mongoose = require('mongoose');
const _ = require('lodash');
const { TOKEN_WAIV } = require('../../constants/hiveEngine');
const { STATISTIC_RECORD_TYPES, RATE_HIVE_ENGINE } = require('../../constants/currencyData');
const db = require('../currenciesDB_Connection');

const rates = () => _.reduce(
  RATE_HIVE_ENGINE,
  (acc, el) => {
    acc.rates[el] = { type: Number, required: true };
    acc.change24h[el] = { type: Number };
    return acc;
  },
  {
    dateString: { type: String, index: true },
    base: {
      type: String, default: TOKEN_WAIV.SYMBOL, valid: TOKEN_WAIV.SYMBOL,
    },
    type: {
      type: String,
      default: STATISTIC_RECORD_TYPES.ORDINARY,
      valid: Object.values(STATISTIC_RECORD_TYPES),
      index: true,
    },
    rates: {},
    change24h: {},
  },
);
const HiveEngineRateSchema = new mongoose.Schema(rates(), { versionKey: false });

const HiveEngineRateModel = db.model('HiveEngineRateSchema', HiveEngineRateSchema, 'hive-engine-rate');

module.exports = HiveEngineRateModel;
