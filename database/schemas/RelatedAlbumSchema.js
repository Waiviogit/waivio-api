const mongoose = require('mongoose');

const { Schema } = mongoose;

const RelatedAlbumSchema = new Schema({
  id: { type: String, required: true },
  body: { type: String, required: true },
}, { versionKey: false });

RelatedAlbumSchema.index({ id: 1, body: 1 }, { unique: true });

const RelatedAlbumModel = mongoose.model('related_album', RelatedAlbumSchema);

module.exports = RelatedAlbumModel;
