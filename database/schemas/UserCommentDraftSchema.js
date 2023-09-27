const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserCommentDraftSchema = new Schema({
  user: { type: String, required: true },
  author: { type: String, required: true },
  permlink: { type: String, required: true },
  body: { type: String, required: true, default: '' },
}, { timestamps: true, versionKey: false });

UserCommentDraftSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 3 });
UserCommentDraftSchema.index({ user: 1, author: 1, permlink: 1 }, { unique: true });

const UserCommentDraftModel = mongoose.model('user_comment_draft', UserCommentDraftSchema);

module.exports = UserCommentDraftModel;
