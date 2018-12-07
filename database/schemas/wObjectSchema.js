const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WObjectSchema = new Schema({
        app: {type: String},
        community: {type: String},
        object_type: {type: String},
        author_permlink: {type: String, index: true, unique: true, required: true},  //unique identity for wobject, link to create object POST
        weight: {type: Number, index: true, default: 1},  //value in STEEM(or WVIO) as a summ of rewards, index for quick sort
        parents: {type: [String], default: []},
        fields: [{
            name: {type: String, index: true, required: true},
            body: {type: String, index: true, required: true},
            weight: {type: Number, default: 1},
            locale: {type: String, default: 'en-US'},
            author: {type: String},     //
            permlink: {type: String}    //author+permlink is link to appendObject COMMENT(or to create object post if it's first field)
        }]
    },
    {
        toObject: {virtuals: true}, timestamps: true
    });

WObjectSchema.virtual('followers',{
    ref: 'User',
    localField: 'author_permlink',
    foreignField: 'objects_follow',
    justOne: false
});

WObjectSchema.virtual('children', {
    ref: 'wobject',
    localField: 'author_permlink',
    foreignField: 'parents',
    justOne: false
});

WObjectSchema.virtual('users', {
    ref: 'User',
    localField: 'author_permlink',
    foreignField: 'w_objects.author_permlink',
    justOne: false
});


const wObjectModel = mongoose.model('wobject', WObjectSchema);
module.exports = wObjectModel;