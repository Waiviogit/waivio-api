const mongoose = require('mongoose');

const { Schema } = mongoose;

const PlacesApiAccessSchema = new Schema({
  userName: { type: String, required: true, index: true },
  date: { type: String, required: true, index: true },
  type: { type: String, required: true, index: true },
  count: { type: Number, required: true },
}, { versionKey: false });

const PlacesApiAccessModel = mongoose.model(
  'places_api_access',
  PlacesApiAccessSchema,
  'places_api_access',
);

module.exports = PlacesApiAccessModel;
