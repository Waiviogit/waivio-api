const mongoose = require('mongoose');

const { Schema } = mongoose;

const AppAffiliateSchema = new Schema({
  countryCode: { type: String },
  type: { type: String },
  host: { type: String, required: true, index: true },
  affiliateCode: { type: String, required: true },
});

const AppAffiliateModel = mongoose.model('app_affiliate', AppAffiliateSchema);

module.exports = AppAffiliateModel;
