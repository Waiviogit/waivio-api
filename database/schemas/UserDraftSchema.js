const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserDraftSchema = new Schema({
  title: { type: String },
  draftId: { type: String, index: true },
  author: { type: String },
  beneficiary: { type: Boolean, default: true },
  upvote: { type: Boolean },
  isUpdating: { type: Boolean },
  body: { type: String },
  originalBody: { type: String },
  jsonMetadata: { type: Object },
  lastUpdated: { type: Number },
  parentAuthor: { type: String },
  parentPermlink: { type: String },
  permlink: { type: String },
  reward: { type: String },
}, { timestamps: true, versionKey: false });

UserDraftSchema.index({ user: 1, author: 1, permlink: 1 }, { unique: true });

const UserDraftModel = mongoose.model('user_draft', UserDraftSchema);

module.exports = UserDraftModel;
