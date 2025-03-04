const mongoose = require('mongoose');

const { Schema } = mongoose;

const PayPalProductSchema = new Schema({
  id: { type: String, required: true, index: true },
  description: { type: String, required: true },
  name: { type: String, required: true, index: true },
  create_time: { type: String, required: true },
}, { versionKey: false });

PayPalProductSchema.index({ name: 1, id: 1 }, { unique: true });

const PayPalProductModel = mongoose.model('paypal_products', PayPalProductSchema, 'paypal_products');

module.exports = PayPalProductModel;
