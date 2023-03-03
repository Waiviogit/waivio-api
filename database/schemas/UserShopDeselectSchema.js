const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserShopDeselectSchema = new Schema({
  userName: { type: String, required: true, index: true },
  authorPermlink: { type: String, required: true },
}, { versionKey: false });

UserShopDeselectSchema.index({ userName: 1, authorPermlink: 1 }, { unique: true });

const UserShopDeselectModel = mongoose.model('UserShopDeselect', UserShopDeselectSchema, 'user_shop_deselect');

module.exports = UserShopDeselectModel;
