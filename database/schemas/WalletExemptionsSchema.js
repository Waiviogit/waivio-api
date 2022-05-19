const mongoose = require('mongoose');

const { Schema } = mongoose;

const WalletExemptionsSchema = new Schema({
  userName: { type: String },
  userWithExemptions: { type: String },
  recordId: { type: mongoose.ObjectId },
  operationNum: { type: Number },
}, { timestamps: false });

WalletExemptionsSchema.index(
  { userName: 1, userWithExemptions: 1, recordId: 1 },
  { unique: true, partialFilterExpression: { recordId: { $exists: true } } },
);
WalletExemptionsSchema.index(
  { userName: 1, userWithExemptions: 1, operationNum: 1 },
  { unique: true, partialFilterExpression: { operationNum: { $exists: true } } },
);

const WalletExemptions = mongoose.model('WalletExemptions', WalletExemptionsSchema, 'wallet_exemptions');

module.exports = WalletExemptions;
