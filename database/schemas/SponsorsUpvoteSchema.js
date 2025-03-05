const mongoose = require('mongoose');
const { BOT_UPVOTE_STATUSES } = require('../../constants/campaignsData');

const { Schema } = mongoose;

const SponsorsUpvoteSchema = new Schema({
  botName: { type: String, required: true },
  sponsor: { type: String, required: true },
  symbol: { type: String },
  author: { type: String, required: true },
  voteWeight: { type: Number, default: 0 },
  permlink: { type: String, required: true },
  reward: { type: Number, required: true },
  currentVote: { type: Number, default: 0 },
  amountToVote: { type: Number, required: true },
  executed: { type: Boolean, default: false },
  totalVotesWeight: { type: Number, default: 0 },
  requiredObject: { type: String, required: true },
  reservationPermlink: { type: String, required: true },
  compensationId: { type: String },
  status: {
    type: String,
    enum: Object.values(BOT_UPVOTE_STATUSES),
    required: true,
    default: BOT_UPVOTE_STATUSES.PENDING,
  },
  startedAt: { type: Date, required: true },
  expiredAt: { type: Date, required: true },
}, { timestamps: true });

const SponsorsUpvoteModel = mongoose.model('SponsorsUpvote', SponsorsUpvoteSchema, 'sponsors_bots_upvotes');

module.exports = SponsorsUpvoteModel;
