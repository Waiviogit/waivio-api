const mongoose = require('mongoose');

const { Schema } = mongoose;

const SpamUserSchema = new Schema({
  user: { type: String, required: true, unique: true },
  type: { type: String, default: 'spaminator' },
  isSpam: { type: Boolean, default: true },
}, { timestamps: false, versionKey: false });

const SpamUserModel = mongoose.model('SpamUser', SpamUserSchema);

module.exports = SpamUserModel;
