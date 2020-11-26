const mongoose = require('mongoose');

const { Schema } = mongoose;

const HideSchema = new Schema({
  userName: { type: String, index: true, required: true },
  author: { type: String, required: true },
  permlink: { type: String, required: true },
}, { versionKey: false });

const HideModel = mongoose.model('hide_content', HideSchema);

module.exports = HideModel;
