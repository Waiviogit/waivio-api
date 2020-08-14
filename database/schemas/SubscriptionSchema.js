const mongoose = require('mongoose');

const { Schema } = mongoose;

const SubscriptionSchema = new Schema({
  follower: { type: String, required: true },
  following: { type: String, required: true },
}, { versionKey: false });

SubscriptionSchema.index({ follower: 1, following: 1 }, { unique: true });
SubscriptionSchema.index({ following: 1 });

SubscriptionSchema.virtual('followerPath', {
  ref: 'User',
  localField: 'follower',
  foreignField: 'name',
  justOne: true,
});

SubscriptionSchema.virtual('followingPath', {
  ref: 'User',
  localField: 'following',
  foreignField: 'name',
  justOne: true,
});

const SubscriptionModel = mongoose.model('Subscriptions', SubscriptionSchema);

module.exports = SubscriptionModel;
