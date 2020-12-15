const mongoose = require('mongoose');

const { Schema } = mongoose;

const MutedUserSchema = new Schema({
  userName: {
    type: String, required: true, index: true, unique: true,
  },
  mutedBy: { type: [String], required: true, default: [] },
  mutedForApps: {
    type: [String], required: true, default: [], index: true,
  },
}, { versionKey: false });

const MutedUserModel = mongoose.model('muted_user', MutedUserSchema);

module.exports = MutedUserModel;
