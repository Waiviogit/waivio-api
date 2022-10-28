const mongoose = require('mongoose');

const { Schema } = mongoose;

const CampaignPostsSchema = new Schema({
  author: { type: String },
  permlink: { type: String },
  guideName: { type: String },
  rewardInToken: { type: Number },
  symbol: { type: String },
});

CampaignPostsSchema.index({ author: 1, permlink: 1 }, { unique: true });

const campaignPostsModel = mongoose.model('campaign_posts', CampaignPostsSchema, 'campaign_posts');

module.exports = campaignPostsModel;
