/* eslint-disable func-names */
const { REFERRAL_TYPES, REFERRAL_STATUSES } = require('constants/referralData');
const { SUPPORTED_CURRENCIES, LANGUAGES } = require('constants/common');
const { getNamespace } = require('cls-hooked');
const mongoose = require('mongoose');

const { Schema } = mongoose;

const ShopSchema = new Schema({
  hideLinkedObjects: { type: Boolean },
}, { _id: false });

const ReferralsSchema = new Schema({
  agent: { type: String, index: true },
  startedAt: { type: Date },
  endedAt: { type: Date },
  type: { type: String, enum: Object.values(REFERRAL_TYPES) },
}, { _id: false });

const UserNotificationsSchema = new Schema({
  activationCampaign: { type: Boolean, default: true },
  deactivationCampaign: { type: Boolean, default: true },
  follow: { type: Boolean, default: true },
  fillOrder: { type: Boolean, default: true },
  mention: { type: Boolean, default: true },
  minimalTransfer: { type: Number, default: 0 },
  reblog: { type: Boolean, default: true },
  reply: { type: Boolean, default: true },
  statusChange: { type: Boolean, default: true },
  transfer: { type: Boolean, default: true },
  powerUp: { type: Boolean, default: true },
  witness_vote: { type: Boolean, default: true },
  myPost: { type: Boolean, default: false },
  myComment: { type: Boolean, default: false },
  myLike: { type: Boolean, default: false },
  like: { type: Boolean, default: true },
  downvote: { type: Boolean, default: false },
  claimReward: { type: Boolean, default: false },
  objectUpdates: { type: Boolean, default: false },
  objectGroupId: { type: Boolean, default: false },
  threadAuthorFollower: { type: Boolean, default: false },
}, { _id: false });

const UserMetadataSchema = new Schema({
  notifications_last_timestamp: { type: Number, default: 0 },
  settings: {
    // Enable this option to use the exit page when clicking on an external link.
    exitPageSetting: { type: Boolean, default: false },
    locale: { type: String, enum: [...LANGUAGES], default: 'auto' }, // which language use on waivio
    // in which language do you want read posts
    postLocales: { type: [{ type: String, enum: [...LANGUAGES] }], default: [] },
    nightmode: { type: Boolean, default: false }, // toggle nightmode on UI
    rewardSetting: { type: String, enum: ['SP', '50', 'STEEM'], default: '50' }, // in which format get rewards from posts
    rewriteLinks: { type: Boolean, default: false }, // change links from steemit.com to waivio.com
    showNSFWPosts: { type: Boolean, default: false }, // show or hide NSFW posts
    upvoteSetting: { type: Boolean, default: false }, // enable auto like on your posts
    hiveBeneficiaryAccount: { type: String, default: '' },
    votePercent: {
      type: Number, min: 1, max: 10000, default: 10000,
    }, // default percent of your upvotes
    votingPower: { type: Boolean, default: true }, // dynamic toggle of vote power on each vote
    userNotifications: { type: UserNotificationsSchema, default: () => ({}) },
    currency: {
      type: String,
      enum: Object.values(SUPPORTED_CURRENCIES),
      default: SUPPORTED_CURRENCIES.USD,
    },
    hideFavoriteObjects: { type: Boolean },
    shop: { type: ShopSchema },
  },
  bookmarks: { type: [String], default: [] },
  drafts: {
    type: [{
      title: { type: String },
      draftId: { type: String },
      author: { type: String },
      beneficiary: { type: Boolean, default: true },
      upvote: { type: Boolean },
      isUpdating: { type: Boolean },
      body: { type: String },
      originalBody: { type: String },
      jsonMetadata: { type: Object },
      lastUpdated: { type: Number },
      parentAuthor: { type: String },
      parentPermlink: { type: String },
      permlink: { type: String },
      reward: { type: String },
    }],
    default: [],
  },
  new_user: { type: Boolean, default: true },
});

const authSchema = new Schema({
  sessions: { type: [Object], select: false },
  _id: { type: String, select: false },
  id: { type: String, select: false },
  provider: { type: String },
});

const UserSchema = new Schema({
  name: { type: String, index: true, unique: true },
  alias: { type: String },
  profile_image: { type: String },
  // arr of author_permlink of objects what user following
  objects_follow: { type: [String], default: [] },
  users_follow: { type: [String], default: [] }, // arr of users which user follow
  json_metadata: { type: String, default: '' },
  posting_json_metadata: { type: String, default: '' },
  wobjects_weight: { type: Number, default: 0 }, // sum of weight of all wobjects
  count_posts: { type: Number, default: 0, index: true }, // count of the all posts
  last_posts_count: { type: Number, default: 0 }, // count of the posts written in last day
  last_posts_counts_by_hours: { type: [Number], default: [] },
  user_metadata: { type: UserMetadataSchema, default: () => ({}), select: false },
  privateEmail: { type: String, default: null, select: false },
  auth: {
    type: authSchema,
    default: null,
  },
  followers_count: { type: Number, default: 0 },
  users_following_count: { type: Number, default: 0 },
  last_root_post: { type: String, default: null },
  stage_version: { type: Number, default: 0, required: true },
  referralStatus: {
    type: String,
    enum: Object.values(REFERRAL_STATUSES),
    default: REFERRAL_STATUSES.NOT_ACTIVATED,
  },
  referral: { type: [ReferralsSchema], default: [] },
  lastActivity: { type: Date, index: true },
  canonical: { type: String },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

UserSchema.index({ wobjects_weight: -1 });
UserSchema.index({ objects_follow: -1 });

UserSchema.virtual('full_objects_follow', { // get full structure of objects instead only author_permlink
  ref: 'wobject',
  localField: 'objects_follow',
  foreignField: 'author_permlink',
  justOne: false,
});

UserSchema.virtual('objects_following_count', {
  ref: 'WobjectSubscriptions',
  localField: 'name',
  foreignField: 'follower',
  justOne: false,
  count: true,
});

UserSchema.virtual('objects_shares_count', {
  ref: 'user_wobjects',
  localField: 'name',
  foreignField: 'user_name',
  count: true,
});

UserSchema.pre('findOneAndUpdate', async function (next) {
  const doc = await this.model.findOne(this.getQuery());
  if (!doc) this.set({ auth: null });
  next();
});

UserSchema.pre('aggregate', function () {
  const session = getNamespace('request-session');

  if (!session.get('authorised_user')) {
    this.pipeline().push({ $project: { user_metadata: 0, 'auth.sessions': 0 } });
  }
});

UserSchema.pre('find', function () {
  this.populate('objects_following_count');
});

UserSchema.pre('findOne', function () {
  this.populate('objects_following_count');
});

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;
