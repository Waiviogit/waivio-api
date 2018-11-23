const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WObjectSchema = new Schema({
        tag: {type: String, index: true, unique: true, required: true},
        weight: Number,  //value in STEEM(or WVIO) as a summ of rewards
        parents: [String],
        fields: [{name: {type: String, index: true}, body: String, weight: Number, locale: String}],
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
    localField: 'tag',
    foreignField: 'parents',
    justOne: false
});

WObjectSchema.virtual('users', {
    ref: 'User',
    localField: 'tag',
    foreignField: 'wObjects.tag',
    justOne: false
});

// WObjectSchema.virtual('followersCount').get(()=>{return this.followersNames.length()});

const wObjectModel = mongoose.model('wobject', WObjectSchema);
module.exports = wObjectModel;