const mongoose = require('mongoose');

const { Schema } = mongoose;

const GuestSpamSchema = new Schema(
  {
    account: { type: String, required: true, index: true },
    body: { type: String, required: true },
    reason: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

const GuestSpamModel = mongoose.model(
  'guest_spam',
  GuestSpamSchema,
  'guest_spam',
);

module.exports = GuestSpamModel;
