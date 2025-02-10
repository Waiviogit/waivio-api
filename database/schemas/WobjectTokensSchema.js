const mongoose = require('mongoose');

const { Schema } = mongoose;

const WobjectTokensSchema = new Schema({
  author_permlink: {
    type: String, index: true, unique: true, required: true,
  },
}, { versionKey: false });

const WobjectTokensModel = mongoose.model('wobject_tokens', WobjectTokensSchema, 'wobject_tokens');

module.exports = WobjectTokensModel;
