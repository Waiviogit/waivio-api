const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WObjectSchema = new Schema({
        app: String,
        community: String,
        authorPermlink: {type: String, index: true, unique: true, required: true},  //unique identity for wobject
        weight: {type: Number, index: true},  //value in STEEM(or WVIO) as a summ of rewards, index for quick sort
        parents: [String],
        fields: [{
            name: {type: String, index: true},
            body: String,
            weight: Number,
            locale: String,
            author: String,       //author+permlink is link to comment with appendObject
            permlink: String}],
        followersNames: [String]
    },
    {
        toObject: {virtuals: true}, timestamps: true
    });

WObjectSchema.virtual('followers',{
    ref: 'User',
    localField: 'followersNames',
    foreignField: 'name',
    justOne: false
});

WObjectSchema.virtual('children', {
    ref: 'wobject',
    localField: 'authorPermlink',
    foreignField: 'parents',
    justOne: false
});

WObjectSchema.virtual('users', {
    ref: 'User',
    localField: 'authorPermlink',
    foreignField: 'wObjects.authorPermlink',
    justOne: false
});


const wObjectModel = mongoose.model('wobject', WObjectSchema);
module.exports = wObjectModel;