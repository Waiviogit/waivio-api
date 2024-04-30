const mongoose = require('mongoose');

const { Schema } = mongoose;

const Accounts = new Schema({
  name: { type: String },
  offset: { type: Number },
}, { _id: false });

const EngineAdvancedReportStatusSchema = new Schema({
  reportId: { type: String, unique: true },
  user: { type: String, index: true },
  currency: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  filterAccounts: { type: [String] },
  accounts: { type: [Accounts] },
  deposits: { type: mongoose.Schema.Types.Decimal128, default: 0 },
  withdrawals: { type: mongoose.Schema.Types.Decimal128, default: 0  },
  status: { type: String },
});

module.exports = mongoose.model(
  'engine_advanced_report_status',
  EngineAdvancedReportStatusSchema,
  'engine_advanced_report_status',
);
