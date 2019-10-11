const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

const WObjectSchema = new Schema(
    {
        app: String,
        community: String,
        object_type: String,
        default_name: { type: String, required: true },
        is_posting_open: { type: Boolean, default: true },
        is_extending_open: { type: Boolean, default: true },
        creator: { type: String, required: true },
        author: { type: String, required: true },
        author_permlink: { type: String, index: true, unique: true, required: true }, // unique identity for wobject, link to create object POST
        weight: { type: Number, default: 1 }, // value in STEEM(or WVIO) as a summ of rewards, index for quick sort
        count_posts: { type: Number, default: 0 },
        parent: { type: String, default: '' },
        children: { type: [ String ], default: [] },
        fields: [ {
            name: { type: String, index: true },
            body: { type: String },
            weight: { type: Number, default: 1 },
            locale: { type: String, default: 'en-US' },
            creator: { type: String },
            author: String, //
            permlink: String, // author+permlink it's link to appendObject COMMENT
            active_votes:
                {
                    type:
                        [ {
                            voter: { type: String },
                            weight: { type: Number }
                        } ],
                    default: []
                }
        } ],
        map: {
            type: {
                type: String, // Don't do `{ location: { type: String } }`
                enum: [ 'Point' ] // 'location.type' must be 'Point'
            },
            coordinates: {
                type: [ Number ] // First element - longitude(-180..180), second element - latitude(-90..90)
            } // [longitude, latitude]
        },
        latest_posts: { type: [ mongoose.Schema.ObjectId ], default: [] }, // always keep last N posts to quick build wobject feed
        status: { type: Object },
        last_posts_count: { type: Number, default: 0 },
        last_posts_counts_by_hours: { type: [ Number ], default: [] }
    },
    {
        toObject: { virtuals: true }, timestamps: true, strict: false
    }
);

WObjectSchema.index( { map: '2dsphere' } );
WObjectSchema.index( { weight: -1 } );

WObjectSchema.virtual( 'followers', {
    ref: 'User',
    localField: 'author_permlink',
    foreignField: 'objects_follow',
    justOne: false
} );

WObjectSchema.virtual( 'child_objects', {
    ref: 'wobject',
    localField: 'children',
    foreignField: 'author_permlink',
    justOne: false
} );

WObjectSchema.virtual( 'users', {
    ref: 'User',
    localField: 'author_permlink',
    foreignField: 'w_objects.author_permlink',
    justOne: false
} );

const wObjectModel = mongoose.model( 'wobject', WObjectSchema );

module.exports = wObjectModel;
