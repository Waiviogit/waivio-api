const mongoose = require('mongoose');

const { Schema } = mongoose;

const RelatedAlbumSchema = new Schema({
  authorPermlink: { type: String, required: true },
  body: { type: String, required: true },
}, { versionKey: false });

RelatedAlbumSchema.index({ authorPermlink: 1, body: 1 }, { unique: true });

const RelatedAlbumModel = mongoose.model('related_album', RelatedAlbumSchema);

module.exports = RelatedAlbumModel;
