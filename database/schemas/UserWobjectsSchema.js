const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserWobjectsSchema = new Schema({
  user_name: { type: String },
  author_permlink: { type: String },
  weight: { type: Number },
}, { timestamps: false });

UserWobjectsSchema.index({ user_name: 1 });
UserWobjectsSchema.index({ weight: -1 });
UserWobjectsSchema.index({ author_permlink: 1, user_name: 1 }, { unique: true });
UserWobjectsSchema.index({ author_permlink: 1, _id: 1 });

UserWobjectsSchema.virtual('full_user', {
  ref: 'User',
  localField: 'user_name',
  foreignField: 'name',
  justOne: true,
});

const UserWobjects = mongoose.model('user_wobjects', UserWobjectsSchema);

module.exports = UserWobjects;
