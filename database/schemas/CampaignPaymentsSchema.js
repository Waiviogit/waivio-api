const mongoose = require('mongoose');

const {
  PAYOUT_TOKEN,
  CAMPAIGN_PAYMENT,
} = require('../../constants/campaignsV2');

const campaignPaymentsSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true, index: true },
    guideName: { type: String, index: true },
    type: { type: String, enum: Object.values(CAMPAIGN_PAYMENT), required: true },
    amount: { type: mongoose.Schema.Types.Decimal128, required: true },
    votesAmount: { type: mongoose.Schema.Types.Decimal128, default: 0 },
    payoutToken: {
      type: String,
      enum: Object.values(PAYOUT_TOKEN),
      required: true,
      index: true,
    },
    beneficiaries: [{
      account: { type: String },
      weight: { type: Number },
    }],
    campaignId: { type: mongoose.Types.ObjectId },
    transactionId: { type: String },
    commission: { type: mongoose.Schema.Types.Decimal128 },
    app: { type: String },
    withdraw: { type: String, default: null },
    isDemoAccount: { type: Boolean, default: false },
    memo: { type: String },
    reviewPermlink: { type: String },
    reservationPermlink: { type: String },
    title: { type: String },
    parentAuthor: { type: String },
    parentPermlink: { type: String },
    reviewObject: { type: String },
    mainObject: { type: String },
    createdAt: { type: Date },
    payoutTokenRateUSD: { type: Number },
  },
  {
    timestamps: true,
  },
);

const campaignPaymentsModel = mongoose.model('campaign_payments', campaignPaymentsSchema, 'campaign_payments');

module.exports = campaignPaymentsModel;
