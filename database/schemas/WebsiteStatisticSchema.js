const mongoose = require('mongoose');

const websiteStatisticSchema = new mongoose.Schema({
  host: { type: String, required: true, index: true },
  visits: { type: Number },
  buyAction: { type: Number },
  buyActionUniq: { type: Number },
  conversion: { type: Number },
  conversionUniq: { type: Number },
}, { timestamps: true });

const websiteStatistic = mongoose.model('website_statistic', websiteStatisticSchema, 'website_statistic');

module.exports = websiteStatistic;
