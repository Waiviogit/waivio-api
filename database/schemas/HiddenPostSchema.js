const mongoose = require('mongoose');

const { Schema } = mongoose;

const HiddenPostSchema = new Schema({
  userName: { type: String, required: true },
  postId: { type: String, required: true },
}, { versionKey: false });

HiddenPostSchema.index({ userName: 1, postId: 1 }, { unique: true });

const HiddenPostModel = mongoose.model('hidden_post', HiddenPostSchema);

module.exports = HiddenPostModel;
