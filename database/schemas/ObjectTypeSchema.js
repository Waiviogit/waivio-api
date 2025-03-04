const mongoose = require('mongoose');
const { FIELDS_NAMES } = require('../../constants/wobjectsData');

const { Schema } = mongoose;

const ObjectTypeSchema = new Schema({
  name: { type: String, index: true, required: true },
  author: { type: String, require: true },
  permlink: { type: String, require: true },
  top_wobjects: { type: [String], default: [] },
  weight: { type: Number, default: 0 },
  // value in STEEM(or WVIO) as a sum of rewards, index for quick sort
  top_experts: { // cached N experts for fast review
    type: [{
      name: { type: String },
      weight: { type: Number, default: 0 },
    }],
    default: [],
  },
  exposedFields: { type: [String], enum: [...Object.values(FIELDS_NAMES)], default: [] },
},
{
  toObject: { virtuals: true }, timestamps: true,
});

ObjectTypeSchema.index({ author: 1, permlink: 1 }, { unique: true });

const ObjectTypeModel = mongoose.model('ObjectType', ObjectTypeSchema);

module.exports = ObjectTypeModel;
