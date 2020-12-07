const mongoose = require('mongoose');

const { Schema } = mongoose;

const HiddenCommentSchema = new Schema({
  userName: { type: String, required: true },
  author: { type: String, required: true },
  permlink: { type: String, required: true },
}, { versionKey: false });

HiddenCommentSchema.index({ userName: 1, author: 1, permlink: 1 }, { unique: true });

const HiddenCommentModel = mongoose.model('hidden_comment', HiddenCommentSchema);

module.exports = HiddenCommentModel;
