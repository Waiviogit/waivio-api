const mongoose = require('mongoose');

const { Schema } = mongoose;

const GeoIpSchema = new Schema({
  network: { type: String, required: true },
  longitude: { type: String, required: true },
  latitude: { type: String, required: true },
}, { versionKey: false });

const GeoIpModel = mongoose.model('geo_ip', GeoIpSchema, 'geo_ip');

module.exports = GeoIpModel;
