const mongoose = require('mongoose');
const { REFUND_TYPES, REFUND_STATUSES } = require('../../constants/sitesConstants');

const websiteRefundSchema = new mongoose.Schema({
  userName: { type: String, required: true, index: true },
  type: { type: String, enum: Object.values(REFUND_TYPES), required: true },
  status: { type: String, enum: Object.values(REFUND_STATUSES), default: REFUND_STATUSES.PENDING },
  blockNum: { type: Number, required: true },
  description: { type: String, default: '' },
  rejectMessage: { type: String, default: '' },
}, { timestamps: true });

const websiteRefund = mongoose.model('websiteRefunds', websiteRefundSchema, 'website_refunds');

module.exports = websiteRefund;
