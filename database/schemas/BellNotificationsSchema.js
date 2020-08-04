const mongoose = require('mongoose');

const { Schema } = mongoose;

const BellNotificationsSchema = new Schema({
  follower: { type: String, required: true },
  following: { type: String, required: true },
}, { versionKey: false });

BellNotificationsSchema.index({ following: 1, follower: 1 }, { unique: true });

const BellNotificationsModel = mongoose.model('BellNotifications', BellNotificationsSchema);

module.exports = BellNotificationsModel;
