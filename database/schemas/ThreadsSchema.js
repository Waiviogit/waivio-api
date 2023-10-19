const mongoose = require('mongoose');

const { Schema } = mongoose;

const StatsSchema = new Schema({
  total_votes: { type: Number, default: 0 },
}, { versionKey: false, _id: false });

const ThreadSchema = new Schema({
  author: { type: String, required: true },
  permlink: { type: String, required: true },
  parent_author: { type: String, required: true },
  parent_permlink: { type: String, required: true },
  body: { type: String, required: true },
  created: { type: String },
  replies: { type: [String], default: [] },
  children: { type: Number, default: 0 },
  depth: { type: Number, default: 1 },
  stats: { type: StatsSchema },
  author_reputation: { type: Number },
  deleted: { type: Boolean, default: false },
  tickers: { type: [String] },
  mentions: { type: [String], default: [] },
  hashtags: { type: [String], default: [] },
  links: { type: [String], default: [] },
  images: { type: [String], default: [] },
  threadstorm: { type: Boolean, default: false },
  // end of original schema leo finance
  net_rshares: { type: Number },

}, { versionKey: false, timestamps: true });

ThreadSchema.index({ author: 1, permlink: 1 }, { unique: true });
ThreadSchema.index({ hashtags: 1, createdAt: -1 });
ThreadSchema.index({ mentions: 1, createdAt: -1 });

const ThreadModel = mongoose.model('thread', ThreadSchema);

module.exports = ThreadModel;
