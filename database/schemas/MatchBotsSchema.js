const mongoose = require('mongoose');

const { Schema } = mongoose;

const MatchBotSchema = new Schema({
  bot_name: { type: String, required: true, unique: true },
  min_voting_power: {
    type: Number, default: 8000, min: 1, max: 10000, required: true,
  },
  sponsors: [
    {
      sponsor_name: { type: String, required: true },
      voting_percent: {
        type: Number, default: 1, min: 0.01, max: 1, required: true,
      },
      note: { type: String, maxlength: 256 },
      enabled: { type: Boolean, default: false, required: true },
      expiredAt: { type: Date, default: null },
    },
  ],
}, { timestamps: true });

const MatchBotModel = mongoose.model('MatchBot', MatchBotSchema, 'match_bots');

module.exports = MatchBotModel;
