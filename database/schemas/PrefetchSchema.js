const mongoose = require('mongoose');

const { Schema } = mongoose;

const PrefetchSchema = new Schema({
  name: { type: String, unique: true, required: true },
  tag: { type: String, required: true },
  type: { type: String, required: true },
  category: { type: String, required: true },
  route: { type: String },
  image: { type: String },
});

PrefetchSchema.index({ type: 1 });
PrefetchSchema.index({ name: 1, type: 1 });

const PrefetchModel = mongoose.model('prefetch', PrefetchSchema);

module.exports = PrefetchModel;
