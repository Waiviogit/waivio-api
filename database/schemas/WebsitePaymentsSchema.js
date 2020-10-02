const mongoose = require('mongoose');
const { PAYMENT_TYPES } = require('constants/sitesConstants');

const websiteHistorySchema = new mongoose.Schema({
  userName: { type: String, required: true, index: true },
  type: { type: String, enum: Object.values(PAYMENT_TYPES), required: true },
  amount: { type: Number, required: true },
  host: { type: String },
  countUsers: { type: Number, default: 0 },
  blockNum: { type: Number, required: true },
}, { timestamps: true });

websiteHistorySchema.index({ createdAt: -1 });

const websiteHistory = mongoose.model('websitePayments', websiteHistorySchema, 'website_payments');

module.exports = websiteHistory;
