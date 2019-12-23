const { getNamespace } = require( 'cls-hooked' );
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const { LANGUAGES } = require( '../../utilities/constants' );

const UserMetadataSchema = new Schema( {
    notifications_last_timestamp: { type: Number, default: 0 },
    settings: {
        exitPageSetting: { type: Boolean, default: false }, // Enable this option to use the exit page when clicking on an external link.
        locale: { type: String, enum: [ ...LANGUAGES ], default: 'auto' }, // which language use on waivio
        postLocales: { type: [ { type: String, enum: [ ...LANGUAGES ] } ], default: [] }, // in which language do you want read posts
        nightmode: { type: Boolean, default: false }, // toggle nightmode on UI
        rewardSetting: { type: String, enum: [ 'SP', '50', 'STEEM' ], default: '50' }, // in which format get rewards from posts
        rewriteLinks: { type: Boolean, default: false }, // change links from steemit.com to waivio.com
        showNSFWPosts: { type: Boolean, default: false }, // show or hide NSFW posts
        upvoteSetting: { type: Boolean, default: false }, // enable auto like on your posts
        votePercent: { type: Number, min: 1, max: 10000, default: 5000 }, // default percent of your upvotes
        votingPower: { type: Boolean, default: false } // dynamic toggle of vote power on each vote
    },
    bookmarks: { type: [ String ], default: [] },
    drafts: {
        type: [ {
            title: { type: String },
            draftId: { type: String },
            author: { type: String },
            beneficiary: { type: Boolean, default: true },
            upvote: { type: Boolean },
            isUpdating: { type: Boolean },
            body: { type: String },
            originalBody: { type: String },
            jsonMetadata: { type: Object },
            lastUpdated: { type: Number },
            parentAuthor: { type: String },
            parentPermlink: { type: String },
            permlink: { type: String },
            reward: { type: String }
        } ],
        default: []
    }
} );

const UserSchema = new Schema( {
    name: { type: String, index: true, unique: true },
    alias: { type: String },
    profile_image: { type: String },
    objects_follow: { type: [ String ], default: [] }, // arr of author_permlink of objects what user following
    users_follow: { type: [ String ], default: [] }, // arr of users which user follow
    json_metadata: { type: String, default: '' },
    wobjects_weight: { type: Number, default: 0 }, // sum of weight of all wobjects
    count_posts: { type: Number, default: 0, index: true }, // count of the all posts
    last_posts_count: { type: Number, default: 0 }, // count of the posts written in last day
    last_posts_counts_by_hours: { type: [ Number ], default: [] },
    user_metadata: { type: UserMetadataSchema, default: () => ( {} ), select: false },
    auth: {
        type: {
            sessions: { type: [ Object ], select: false },
            sid: { type: String },
            provider: { type: String }
        }
    }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } } );

UserSchema.index( { wobjects_weight: -1 } );
UserSchema.index( { users_follow: -1 } );

UserSchema.virtual( 'full_objects_follow', { // get full structure of objects instead only author_permlink
    ref: 'wobject',
    localField: 'objects_follow',
    foreignField: 'author_permlink',
    justOne: false
} );

UserSchema.virtual( 'followers_count', {
    ref: 'User',
    localField: 'name',
    foreignField: 'users_follow',
    count: true
} );

UserSchema.virtual( 'objects_following_count' ).get( function () {
    return this.objects_follow.length;
} );

UserSchema.virtual( 'objects_shares_count', {
    ref: 'user_wobjects',
    localField: 'name',
    foreignField: 'user_name',
    count: true
} );

UserSchema.pre( 'aggregate', function () {
    const session = getNamespace( 'request-session' );

    if( !session.get( 'authorised_user' ) ) {
        this.pipeline().push( { $project: { user_metadata: 0, 'auth.sessions': 0 } } );
    }
} );

const UserModel = mongoose.model( 'User', UserSchema );

module.exports = UserModel;
