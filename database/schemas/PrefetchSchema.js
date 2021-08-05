const mongoose = require('mongoose');

const { Schema } = mongoose;

const PrefetchSchema = new Schema({
  name: { type: String, unique: true, required: true },
  category: { type: String, required: true },
  route: { type: String },
  image: { type: String },
});

PrefetchSchema.index({ name: 1 });
PrefetchSchema.index({ category: 1 });

const PrefetchModel = mongoose.model('prefetch', PrefetchSchema);

module.exports = PrefetchModel;
