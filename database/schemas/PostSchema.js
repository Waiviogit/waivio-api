const mongoose = require( 'mongoose' );
const mongooseLeanVirtuals = require( 'mongoose-lean-virtuals' );

const Schema = mongoose.Schema;

const PostSchema = new Schema( {
    id: { type: Number },
    author: { type: String },
    permlink: { type: String },
    parent_author: { type: String, default: '' },
    parent_permlink: { type: String, required: true },
    title: { type: String, required: true, default: '' },
    body: { type: String, required: true, default: '' },
    json_metadata: { type: String, required: true, default: '' },
    app: { type: String },
    depth: { type: Number, default: 0 },
    total_vote_weight: { type: Number, default: 0 },
    active_votes: [ {
        voter: { type: String, required: true },
        author: { type: String, required: true },
        permlink: { type: String, required: true },
        weight: { type: Number, required: true }
    } ],
    wobjects: [ {
        author_permlink: { type: String, index: true },
        percent: { type: Number },
        tagged: { type: String }
    } ]
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true
} );

PostSchema.virtual( 'post_id' ).get( function () {
    return this.id;
} );

PostSchema.virtual( 'fullObjects', {
    ref: 'wobject',
    localField: 'wobjects.author_permlink',
    foreignField: 'author_permlink',
    justOne: false
} );

PostSchema.plugin( mongooseLeanVirtuals );

PostSchema.index( { author: 1, permlink: 1 }, { unique: true } );

const PostModel = mongoose.model( 'Post', PostSchema );

module.exports = PostModel;
