const mongoose = require('mongoose');

const { Schema } = mongoose;

const PostSchema = new Schema({
  id: { type: Number },
  author: { type: String },
  permlink: { type: String },
  parent_author: { type: String, default: '' },
  parent_permlink: { type: String, required: true },
  root_author: { type: String },
  title: { type: String, required: true, default: '' },
  body: { type: String, required: true, default: '' },
  json_metadata: { type: String, required: true, default: '' },
  app: { type: String },
  depth: { type: Number, default: 0 },
  total_vote_weight: { type: Number, default: 0 },
  active_votes: [{
    voter: { type: String },
    weight: { type: Number },
    percent: { type: Number },
    rshares: { type: Number },
    rsharesWAIV: { type: Number },
  }],
  wobjects: [{
    author_permlink: { type: String },
    percent: { type: Number },
    tagged: { type: String },
    object_type: { type: String, index: true },
  }],
  language: { type: String, default: 'en-US' },
  author_weight: { type: Number },
  reblog_to: { type: { author: String, permlink: String } },
  reblogged_users: { type: [String], default: [] },
  blocked_for_apps: { type: [String], default: [] },
  net_rshares: { type: Number },
  net_rshares_WAIV: { type: Number },
  total_payout_WAIV: { type: Number },
  pending_payout_value: { type: String },
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
  timestamps: true,
});

// eslint-disable-next-line func-names
PostSchema.virtual('post_id').get(function () {
  return this.id;
});

PostSchema.virtual('fullObjects', {
  ref: 'wobject',
  localField: 'wobjects.author_permlink',
  foreignField: 'author_permlink',
  justOne: false,
});

PostSchema.plugin(mongooseLeanVirtuals);

PostSchema.index({ author: 1, permlink: 1 }, { unique: true });
PostSchema.index({ root_author: 1, permlink: 1 }, { unique: true });
PostSchema.index({ author: 1, language: 1 });
PostSchema.index({ 'wobjects.author_permlink': 1, _id: 1 });
PostSchema.index({ _id: 1, author_weight: 1, net_rshares: -1 });
PostSchema.index({ net_rshares: -1 });

const PostModel = mongoose.model('Post', PostSchema);

module.exports = PostModel;
