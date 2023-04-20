const mongoose = require('mongoose');

const { Schema } = mongoose;

const AppAffiliateSchema = new Schema({
  countryCode: { type: String },
  type: { type: String },
  host: { type: String, required: true, index: true },
  affiliateCode: { type: String, required: true },
});

AppAffiliateSchema.index({ host: 1, type: 1, countryCode: 1 }, { unique: true });

const AppAffiliateModel = mongoose.model('app_affiliate', AppAffiliateSchema);

module.exports = AppAffiliateModel;
