const mongoose = require('mongoose');

const { Schema } = mongoose;

const CommentSchema = new Schema({
  author: { type: String, required: true },
  permlink: { type: String, required: true },
  root_author: { type: String, required: true },
  root_permlink: { type: String, required: true },
  parent_author: { type: String, required: true },
  parent_permlink: { type: String, required: true },
  active_votes: {
    type: [{
      voter: { type: String },
      percent: { type: Number },
    }],
    default: [],
  },
  guestInfo: {
    type: { userId: String, social: String },
    default: null,
  },
}, { timestamps: false, versionKey: false });

CommentSchema.index({ author: 1, permlink: 1 }, { unique: true });
CommentSchema.index({ root_author: 1, root_permlink: 1 });
CommentSchema.index({ parent_author: 1, parent_permlink: 1 });
CommentSchema.index({ 'guestInfo.userId': 1 });

const CommentModel = mongoose.model('Comments', CommentSchema);

module.exports = CommentModel;
