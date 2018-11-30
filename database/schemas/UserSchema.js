const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: {type: String, index: true, unique: true},
    profile_image: String,
    w_objects:[{
        author_permlink:String,
        weight: Number,  //Object Shares, value in STEEM(or WVIO) coin
        rank: Number     //Object Expertise, value from 1 to 99
    }],
    read_locales:[String]
},{timestamps: true});
const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;