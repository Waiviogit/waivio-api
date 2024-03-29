const mongoose = require('mongoose');

const { Schema } = mongoose;

const GeoIpSchema = new Schema({
  ip: { type: String, required: true, index: true },
  longitude: { type: Number, required: true },
  latitude: { type: Number, required: true },
  countryCode: { type: String },
}, { versionKey: false });

const GeoIpModel = mongoose.model('geo_ips', GeoIpSchema);

module.exports = GeoIpModel;
