const mongoose = require('mongoose');

const { Schema } = mongoose;

const AuthoritySchema = new Schema({
  administrative: { type: [String], default: [] },
  ownership: { type: [String], default: [] },
}, { _id: false });

const FieldsSchema = new Schema({
  name: { type: String },
  body: { type: String },
  id: { type: String },
  tagCategory: { type: String },
  weight: { type: Number, default: 1 },
  locale: { type: String, default: 'en-US' },
  creator: { type: String },
  author: String, //
  permlink: String, // author+permlink it's link to appendObject COMMENT
  endDate: Number, // author+permlink it's link to appendObject COMMENT
  startDate: Number, // author+permlink it's link to appendObject COMMENT
  active_votes: {
    type: [{
      voter: { type: String },
      weight: { type: Number },
      percent: { type: Number },
      rshares_weight: { type: Number },
    }],
    default: [],
  },
});

const WObjectSchema = new Schema(
  {
    app: String,
    community: String,
    object_type: String,
    default_name: { type: String, required: true },
    is_posting_open: { type: Boolean, default: true },
    is_extending_open: { type: Boolean, default: true },
    creator: { type: String, required: true },
    author: { type: String, required: true },
    author_permlink: {
      type: String, index: true, unique: true, required: true,
    }, // unique identity for wobject, link to create object POST
    // value in STEEM(or WVIO) as a summ of rewards, index for quick sort
    weight: { type: Number, default: 1 },
    count_posts: { type: Number, default: 0 },
    parent: { type: String, default: '' },
    children: { type: [String], default: [] },
    authority: { type: AuthoritySchema, default: () => ({}) },
    fields: { type: [FieldsSchema], default: [] },
    map: {
      type: {
        type: String, // Don't do `{ location: { type: String } }`
        enum: ['Point'], // 'location.type' must be 'Point'
      },
      coordinates: {
        type: [Number], // First element - longitude(-180..180), second element - latitude(-90..90)
      }, // [longitude, latitude]
    },
    // always keep last N posts to quick build wobject feed
    latest_posts: { type: [mongoose.Schema.ObjectId], default: [] },
    status: { type: Object },
    last_posts_count: { type: Number, default: 0 },
    last_posts_counts_by_hours: { type: [Number], default: [] },
    activeCampaigns: { type: [mongoose.Types.ObjectId], default: [] },
    activeCampaignsCount: { type: Number, default: 0 },
    search: { type: [String], default: [] },
    metaGroupId: { type: String, index: true },
  },
  {
    toObject: { virtuals: true }, timestamps: true, strict: false,
  },
);

WObjectSchema.index({ map: '2dsphere' });
WObjectSchema.index({ weight: -1 });
AuthoritySchema.index({ administrative: -1 });
AuthoritySchema.index({ ownership: -1 });
FieldsSchema.index({ name: -1, body: -1 });
WObjectSchema.index({ search: -1 });
WObjectSchema.index({ activeCampaignsCount: -1, weight: -1 });
WObjectSchema.index({ object_type: -1, weight: -1 });
WObjectSchema.index({ 'status.title': -1, 'status.link': -1 });

WObjectSchema.virtual('followers', {
  ref: 'User',
  localField: 'author_permlink',
  foreignField: 'objects_follow',
  justOne: false,
});

WObjectSchema.virtual('users', {
  ref: 'User',
  localField: 'author_permlink',
  foreignField: 'w_objects.author_permlink',
  justOne: false,
});

const wObjectModel = mongoose.model('wobject', WObjectSchema);

module.exports = wObjectModel;
