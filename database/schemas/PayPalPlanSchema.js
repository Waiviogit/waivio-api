const mongoose = require('mongoose');

const { Schema } = mongoose;

const PayPalPlanSchema = new Schema({
  id: { type: String, required: true, index: true },
  product_id: { type: String, required: true, index: true },
  name: { type: String, required: true, index: true },
  status: { type: String, required: true },
  description: { type: String, required: true },
  usage_type: { type: String, required: true },
  create_time: { type: String, required: true },
}, { versionKey: false });

const PayPalPlanModel = mongoose.model('paypal_plans', PayPalPlanSchema, 'paypal_plans');

module.exports = PayPalPlanModel;
