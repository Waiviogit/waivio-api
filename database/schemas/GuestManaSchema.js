const mongoose = require('mongoose');

const { Schema } = mongoose;

const GuestManaSchema = new Schema(
  {
    account: { type: String, required: true },
    mana: { type: Number, required: true },
    lastManaUpdate: { type: Number, default: 0 },
    importAuthorization: { type: Boolean, default: false },
  },
  {
    timestamps: false,
  },
);

GuestManaSchema.index({ account: 1 }, { unique: true });

const GuestManaModel = mongoose.model(
  'guest_mana',
  GuestManaSchema,
  'guest_mana',
);

module.exports = GuestManaModel;
