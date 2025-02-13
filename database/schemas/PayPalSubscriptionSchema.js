const mongoose = require('mongoose');

const { Schema } = mongoose;

const PayPalSubscriptionSchema = new Schema({
  id: { type: String, required: true, index: true },
  plan_id: { type: String, required: true, index: true },
  product_id: { type: String, required: true, index: true },
  status: { type: String, default: 'ACTIVE' },
}, { versionKey: false });

const PayPalSubscriptionsModel = mongoose.model('paypal_subscriptions', PayPalSubscriptionSchema, 'paypal_subscriptions');

module.exports = PayPalSubscriptionsModel;
