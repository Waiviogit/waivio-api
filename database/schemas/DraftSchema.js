const mongoose = require('mongoose');

const { Schema } = mongoose;

const DraftSchema = new Schema({
  author: { type: String, required: true },
  permlink: { type: String, required: true },
  body: { type: String, required: true, default: '' },
}, { timestamps: false, versionKey: false });

DraftSchema.index({ author: 1, permlink: 1 }, { unique: true });

const DraftModel = mongoose.model('Drafts', DraftSchema);

module.exports = DraftModel;
