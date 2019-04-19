const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

const UserSchema = new Schema( {
    name: { type: String, index: true, unique: true },
    profile_image: String,
    read_locales: [ String ],
    objects_follow: { type: [ String ], default: [] } // arr of author_permlink of objects what user following
}, { timestamps: true } );

UserSchema.virtual( 'full_objects_follow', { // get full structure of objects instead only author_permlink
    ref: 'wobject',
    localField: 'objects_follow',
    foreignField: 'author_permlink',
    justOne: false
} );


const UserModel = mongoose.model( 'User', UserSchema );

module.exports = UserModel;
