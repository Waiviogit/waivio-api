const mongoose = require('mongoose');
const _ = require('lodash');
const { REFERRAL_TYPES } = require('constants/referralData');

const { Schema } = mongoose;

const topUsersSchema = new Schema({
  name: { type: String, required: true },
  weight: { type: Number, default: 0 },
}, { _id: false });

const TagsData = new Schema({
  Ingredients: { type: Object, default: {} },
  Cuisine: { type: Object, default: {} },
  'Good For': { type: Object, default: {} },
  Features: { type: Object, default: {} },
}, { _id: false });

const ReferralTimersSchema = new Schema({
  type: { type: String, enum: Object.values(REFERRAL_TYPES) },
  duration: { type: Number, default: 90 },
}, { _id: false });

const botSchema = new Schema({
  name: { type: String, required: true },
  postingKey: { type: String, required: true },
  roles: { type: [String], required: true },
}, { _id: false });

const AppCommissions = new Schema({
  campaigns_server_acc: { type: String, required: true },
  campaigns_percent: {
    type: Number, min: 0, max: 1, required: true,
  },
  index_commission_acc: { type: String, required: true },
  index_percent: {
    type: Number, min: 0, max: 1, required: true,
  },
  referral_commission_acc: { type: String, required: true },
}, { _id: false });

const MapPoints = new Schema({
  topPoint: { type: [Number], required: true }, // First element - longitude(-180..180), second element - latitude(-90..90)
  bottomPoint: { type: [Number], required: true }, // First element - longitude(-180..180), second element - latitude(-90..90)
}, { _id: false });

const Colors = new Schema({
  background: { type: String },
  font: { type: String },
  hover: { type: String },
  header: { type: String },
  button: { type: String },
  border: { type: String },
  focus: { type: String },
  links: { type: String },
}, { _id: false });

const Configuration = new Schema({
  configurationFields: { type: [String] },
  desktopLogo: { type: String },
  mobileLogo: { type: String },
  aboutObject: { type: String },
  desktopMap: { type: MapPoints },
  mobileMap: { type: MapPoints },
  colors: { type: Colors },

}, { _id: false });

const AppSchema = new Schema({
  name: { type: String, index: true, unique: true },
  owner: { type: String, required: true },
  googleAnalyticsTag: { type: String, default: null },
  beneficiary: {
    account: { type: String, default: 'waivio' },
    percent: { type: Number, default: 300 },
  },
  configuration: { type: Configuration },
  host: { type: String, required: true, unique: true },
  admins: { type: [String], default: [] },
  authority: { type: [String], default: [] },
  moderators: { type: [String], default: [] },
  supported_object_types: { type: [String], default: [] },
  object_filters: { type: Object, default: {} },
  black_list_users: { type: [String], default: [] },
  supported_hashtags: { type: [String], default: [] },
  canBeExtended: { type: Boolean, default: false },
  inherited: { type: Boolean, default: true },
  supported_objects: { type: [String], index: true, default: [] },
  top_users: { type: [topUsersSchema] },
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
  service_bots: { type: [botSchema], default: [], select: false },
  app_commissions: { type: AppCommissions },
  referralsData: { type: [ReferralTimersSchema], default: [] },
  tagsData: { type: TagsData },
}, { timestamps: true });

AppSchema.pre('save', async function (doc) {
  if (doc && doc.parent) {
    const parent = await this.model.find({ parent: doc.parent }).lean();
    if (!parent) return;
    doc.supported_object_types = parent.supported_object_types;
    doc.object_filters = parent.object_filters;
    if (!doc.configuration) doc.configuration = {};
    doc.configuration.configurationFields = _.get(parent, 'configuration.configurationFields', []);
  }
});

const AppModel = mongoose.model('App', AppSchema);

module.exports = AppModel;
