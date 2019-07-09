const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

const UserSchema = new Schema( {
    name: { type: String, index: true, unique: true },
    profile_image: { type: String },
    read_locales: { type: [ String ], default: [] },
    objects_follow: { type: [ String ], default: [] }, // arr of author_permlink of objects what user following
    users_follow: { type: [ String ], default: [] }, // arr of users which user follow
    json_metadata: { type: String, default: '' },
    wobjects_weight: { type: Number, default: 0 }, // sum of weight of all wobjects
    count_posts: { type: Number, default: 0, index: true },
    app_settings: { type: Object, default: [] } // custom settings like night_mode, default percent of vote etc.
}, { timestamps: true } );

UserSchema.index( { wobjects_weight: -1 } );

UserSchema.virtual( 'full_objects_follow', { // get full structure of objects instead only author_permlink
    ref: 'wobject',
    localField: 'objects_follow',
    foreignField: 'author_permlink',
    justOne: false
} );


const UserModel = mongoose.model( 'User', UserSchema );

module.exports = UserModel;
