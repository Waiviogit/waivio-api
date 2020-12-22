const mongoose = require('mongoose');

const { Schema } = mongoose;

const MutedUserSchema = new Schema({
  userName: { type: String, required: true },
  mutedBy: { type: String, required: true },
  mutedForApps: {
    type: [String], required: true, index: true,
  },
}, { versionKey: false });

MutedUserSchema.index({ userName: 1, mutedBy: 1 }, { unique: true });

const MutedUserModel = mongoose.model('muted_user', MutedUserSchema);

module.exports = MutedUserModel;
