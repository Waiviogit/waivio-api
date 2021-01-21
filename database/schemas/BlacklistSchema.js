const mongoose = require('mongoose');

const { Schema } = mongoose;

const blacklistSchema = new Schema({
  user: {
    type: String, required: true, index: true, unique: true,
  },
  whiteList: { type: [String], default: [] },
  blackList: { type: [String], default: [] },
  followLists: { type: [String], default: [] },
});

blacklistSchema.pre('save', function (next) {
  this.whiteList = [this.user];
  next();
});

blacklistSchema.post('findOne', async function (doc) {
  if (doc && doc.followLists) {
    doc.followLists = await this.model.find({ user: { $in: doc.followLists } }).lean();
  }
});

const blacklistModel = mongoose.model('Blacklist', blacklistSchema, 'guide-blacklists');

module.exports = blacklistModel;
