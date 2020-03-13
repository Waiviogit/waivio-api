const mongoose = require('mongoose');

const { Schema } = mongoose;

const AppSchema = new Schema({
  name: { type: String, index: true, unique: true },
  admins: { type: [String], index: true, required: true },
  moderators: [{
    name: { type: String, required: true },
    author_permlinks: { type: [String], default: [] },
  }],
  supported_object_types: [{
    object_type: { type: String, index: true },
    required_fields: { type: [String], default: [] },

  }],
  blacklists: {
    wobjects: [],
    posts: [{
      author: { type: String, required: true },
      permlink: { type: String, required: true },
    }],
    users: [],
  },
  supported_objects: { type: [String], index: true, default: [] },
  supported_hashtags: { type: [String], default: [] },
  daily_chosen_post: {
    author: { type: String },
    permlink: { type: String },
    title: { type: String },
  },
  weekly_chosen_post: {
    author: { type: String },
    permlink: { type: String },
    title: { type: String },
  },
}, { timestamps: true });

const AppModel = mongoose.model('App', AppSchema);

module.exports = AppModel;
