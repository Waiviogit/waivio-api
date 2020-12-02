const mongoose = require('mongoose');

const { Schema } = mongoose;

const RelatedAlbumSchema = new Schema({
  wobjAuthorPermlink: { type: String, required: true },
  postAuthorPermlink: { type: String, required: true },
  images: { type: [String], default: [] },
}, { versionKey: false });

RelatedAlbumSchema.index({ wobjAuthorPermlink: 1, postAuthorPermlink: 1 }, { unique: true });

const RelatedAlbumModel = mongoose.model('related_album', RelatedAlbumSchema);

module.exports = RelatedAlbumModel;
