const mongoose = require('mongoose');

const { Schema } = mongoose;

const withdrawSchema = new Schema({
  account: { type: String, required: true },
  email: { type: String },
  inputCoinType: { type: String, required: true },
  outputCoinType: { type: String, required: true },
  amount: { type: Number, required: true },
  outputAmount: { type: Number, default: null },
  status: { type: String, enum: ['pending', 'success', 'failed', 'expired'], default: 'pending' },
  address: { type: String, required: true },
  memo: { type: String, required: true, index: true },
  usdValue: { type: Number, required: true },
  commission: { type: Number, default: 0 },
  receiver: { type: String, required: true },
  transactionId: { type: String, default: null },
  transactionHash: { type: String, default: null },
  exchangeId: { type: String, default: null },
  auth: {
    id: { type: String },
    provider: { type: String },
  },
});

const withdrawFundsModel = mongoose.model('withdraw-funds', withdrawSchema);

module.exports = withdrawFundsModel;
