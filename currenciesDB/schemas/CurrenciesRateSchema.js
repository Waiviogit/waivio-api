const db = require('../currenciesDB_Connection');
const mongoose = require('mongoose');
const _ = require('lodash');
const { SUPPORTED_CURRENCIES } = require('../../constants/common');
const { BASE_CURRENCIES, RATE_CURRENCIES } = require('../../constants/currencyData');

const rate = () => _.reduce(
  RATE_CURRENCIES,
  (acc, el) => {
    acc.rates[el] = { type: Number, required: true };
    return acc;
  },
  {
    dateString: { type: String, index: true },
    base: { type: String, default: SUPPORTED_CURRENCIES.USD, enum: BASE_CURRENCIES },
    rates: {},
  },
);
const CurrenciesRateSchema = new mongoose.Schema(rate(), { versionKey: false });

CurrenciesRateSchema.index({ base: 1, dateString: -1 }, { unique: true });
const CurrenciesRateModel = db.model('CurrenciesRate', CurrenciesRateSchema, 'currencies-rates');

module.exports = CurrenciesRateModel;
