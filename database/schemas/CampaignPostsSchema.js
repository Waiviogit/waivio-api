const mongoose = require('mongoose');

const { Schema } = mongoose;

const CampaignPostsSchema = new Schema({
  author: { type: String },
  permlink: { type: String },
  guideName: { type: String },
  rewardInToken: { type: Number },
  payoutTokenRateUSD: { type: Number },
  symbol: { type: String },
  reservationPermlink: { type: String },
});

CampaignPostsSchema.index({ author: 1, permlink: 1, reservationPermlink: 1 }, { unique: true });

const campaignPostsModel = mongoose.model('campaign_posts', CampaignPostsSchema, 'campaign_posts');

module.exports = campaignPostsModel;
