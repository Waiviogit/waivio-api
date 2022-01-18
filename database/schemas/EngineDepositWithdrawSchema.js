const mongoose = require('mongoose');
const { TRANSACTION_TYPES } = require('constants/hiveEngine');

const { Schema } = mongoose;

const depositWithdrawTypes = [TRANSACTION_TYPES.DEPOSIT, TRANSACTION_TYPES.WITHDRAW];

const EngineDepositWithdrawSchema = new Schema({
  userName: { type: String, required: true, index: true },
  type: { type: String, enum: depositWithdrawTypes, required: true },
  from_coin: { type: String, required: true },
  to_coin: { type: String, required: true },
  destination: { type: String, required: true },
  pair: { type: String, required: true },
  address: { type: String },
  account: { type: String },
  memo: { type: String },
  ex_rate: { type: Number, required: true },
  withdrawalAmount: { type: Number },
}, { versionKey: false, timestamps: true });

const EngineDepositWithdrawModel = mongoose.model('engine_deposit_withdraw', EngineDepositWithdrawSchema);

module.exports = EngineDepositWithdrawModel;
