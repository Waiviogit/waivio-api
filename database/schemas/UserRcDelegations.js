const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserRcDelegationsSchema = new Schema({
  delegator: { type: String, require: true },
  delegatee: { type: String, require: true, index: true },
  rc: { type: Number, default: 0 },
}, { timestamps: false, versionKey: false });

UserRcDelegationsSchema.index({ delegator: 1, delegatee: 1 }, { unique: true });

const UserRcDelegations = mongoose.model('user_rc_delegations', UserRcDelegationsSchema);

module.exports = UserRcDelegations;
