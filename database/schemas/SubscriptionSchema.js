const mongoose = require('mongoose');

const { Schema } = mongoose;

const SubscriptionSchema = new Schema({
  follower: { type: String, required: true },
  following: { type: String, required: true },
}, { versionKey: false });

SubscriptionSchema.index({ follower: 1, following: 1 }, { unique: true });

const SubscriptionModel = mongoose.model('Subscriptions', SubscriptionSchema);

module.exports = SubscriptionModel;
