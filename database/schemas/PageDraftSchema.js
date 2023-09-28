const mongoose = require('mongoose');

const { Schema } = mongoose;

const PageDraftSchema = new Schema({
  user: { type: String, required: true },
  author_permlink: { type: String, required: true },
  body: { type: String, required: true, default: '' },
}, { timestamps: true, versionKey: false });

PageDraftSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 3 });
PageDraftSchema.index({ user: 1, author_permlink: 1 }, { unique: true });

const PageDraftModel = mongoose.model('page_drafts', PageDraftSchema);

module.exports = PageDraftModel;
