const mongoose = require('mongoose');
const { SUPPORTED_CURRENCIES, ADVANCED_REPORT_SYMBOLS } = require('constants/common');

const { Schema } = mongoose;

const supportedCurrencies = Object.values(SUPPORTED_CURRENCIES);

const availableRateFields = supportedCurrencies.reduce((acc, el) => {
  acc[el] = { type: Number };
  return acc;
}, {});

const availableSymbolRateFields = ADVANCED_REPORT_SYMBOLS.reduce((acc, el) => ({
  ...acc,
  ...supportedCurrencies.reduce((acc2, currency) => {
    acc2[`${el}.${currency}`] = { type: Number };
    return acc2;
  }, {}),
}), {});

const EngineAdvancedReportSchema = new Schema({
  reportId: { type: String },
  refHiveBlockNumber: { type: Number },
  blockNumber: { type: Number },
  account: { type: String },
  transactionId: { type: String },
  operation: { type: String },
  symbolOut: { type: String },
  symbolOutQuantity: { type: String },
  symbolIn: { type: String },
  symbolInQuantity: { type: String },
  timestamp: { type: Number },
  quantity: { type: String },
  symbol: { type: String },
  tokenState: { type: String },
  withdrawDeposit: { type: String },
  authorperm: { type: String },
  memo: { type: String },
  checked: { type: Boolean },
  ...availableRateFields,
  ...availableSymbolRateFields,
}, { versionKey: false });

const EngineAdvancedReportModel = mongoose.model('engine_advanced_report', EngineAdvancedReportSchema, 'engine_advanced_report');

module.exports = EngineAdvancedReportModel;
