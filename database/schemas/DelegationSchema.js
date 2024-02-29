const mongoose = require('mongoose');

const { Schema } = mongoose;

const DelegationSchema = new Schema({
  delegator: { type: String, required: true, index: true },
  delegatee: { type: String, required: true, index: true },
  vesting_shares: { type: Number, required: true },
  delegation_date: { type: String, required: true },
}, { timestamps: false, versionKey: false });

const DelegationModel = mongoose.model('delegations', DelegationSchema, 'delegations');

module.exports = DelegationModel;
