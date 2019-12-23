const Joi = require( 'joi' );
const { LANGUAGES } = require( '../../utilities/constants' );

exports.indexSchema = Joi.object().keys( {
    limit: Joi.number().integer().min( 1 ).default( 30 ),
    skip: Joi.number().integer().min( 0 ).default( 0 ),
    sample: Joi.boolean().truthy( 'true' )
} );

exports.objectsSharesSchema = Joi.object().keys( {
    limit: Joi.number().integer().min( 1 ).max( 100 ).default( 30 ),
    skip: Joi.number().integer().min( 0 ).default( 0 ),
    locale: Joi.string().default( 'en-US' ),
    name: Joi.string().required(),
    object_types: Joi.array().items( Joi.string().required() ).default( null ),
    exclude_object_types: Joi.array().items( Joi.string().required() ).default( null )
} );

exports.getPostFiltersSchema = Joi.object().keys( {
    limit: Joi.number().integer().min( 1 ).max( 300 ).default( 30 ),
    skip: Joi.number().integer().min( 0 ).max( 300 ).default( 0 ),
    name: Joi.string().required()
} );

exports.showSchema = Joi.string().required();

exports.objectsFollowSchema = Joi.object().keys( {
    name: Joi.string().required(),
    locale: Joi.string().default( 'en-US' ),
    limit: Joi.number().integer().min( 0 ).max( 100 ).default( 50 ),
    skip: Joi.number().integer().min( 0 ).default( 0 )
} );

exports.objectsFeedSchema = Joi.object().keys( {
    user: Joi.string().required(),
    limit: Joi.number().integer().min( 0 ).max( 50 ).default( 30 ),
    skip: Joi.number().integer().min( 0 ).default( 0 )
} );

exports.feedSchema = Joi.object().keys( {
    name: Joi.string().required(),
    limit: Joi.number().integer().min( 0 ).max( 50 ).default( 20 ),
    skip: Joi.number().integer().min( 0 ).default( 0 ),
    filter: Joi.object().keys( {
        byApp: Joi.string().allow( '' )
    } ),
    user_languages: Joi.array().items( Joi.string().valid( [ ...LANGUAGES ] ) ).default( [ 'ru-RU' ] )
} );

exports.searchSchema = Joi.object().keys( {
    searchString: Joi.string().required(),
    limit: Joi.number().integer().min( 0 ).max( 100 ).default( 20 )
} );

exports.updateMetadataSchema = Joi.object().keys( {
    user_name: Joi.string().required(),
    user_metadata: Joi.object().keys( {
        notifications_last_timestamp: Joi.number().min( 0 ).default( 0 ),
        bookmarks: Joi.array().items( Joi.string() ).default( [] ),
        settings: Joi.object().keys( {
            exitPageSetting: Joi.boolean().default( false ),
            locale: Joi.string().valid( [ ...LANGUAGES ] ).default( 'auto' ),
            postLocales: Joi.array().items( Joi.string().valid( [ ...LANGUAGES ] ) ).default( [] ),
            nightmode: Joi.boolean().default( false ),
            rewardSetting: Joi.string().valid( [ 'SP', '50', 'STEEM' ] ).default( '50' ),
            rewriteLinks: Joi.boolean().default( false ),
            showNSFWPosts: Joi.boolean().default( false ),
            upvoteSetting: Joi.boolean().default( false ),
            votePercent: Joi.number().min( 1 ).max( 10000 ).default( 5000 ),
            votingPower: Joi.boolean().default( false )
        } ).default( {
            exitPageSetting: false,
            locale: 'auto',
            postLocales: [],
            nightmode: false,
            rewardSetting: '50',
            showNSFWPosts: false,
            upvoteSetting: false,
            votePercent: 5000,
            votingPower: false
        } ),
        drafts: Joi.array().items( Joi.object().keys( {
            _id: Joi.string(),
            draftId: Joi.string(),
            title: Joi.string(),
            author: Joi.string(),
            beneficiary: Joi.boolean().default( false ),
            isUpdating: Joi.boolean(),
            upvote: Joi.boolean().optional(),
            body: Joi.string(),
            originalBody: Joi.string(),
            jsonMetadata: Joi.object(),
            lastUpdated: Joi.number(),
            parentAuthor: Joi.string().allow( '' ),
            parentPermlink: Joi.string(),
            permlink: Joi.string(),
            reward: Joi.string().optional()
        } )
        ).default( [] )
    } )
} );

exports.blogSchema = Joi.object().keys( {
    name: Joi.string().required(),
    limit: Joi.number().integer().min( 0 ).default( 20 ),
    skip: Joi.number().integer().min( 0 ).default( 0 ),
    start_author: Joi.string().allow( '' ).default( '' ),
    start_permlink: Joi.string().allow( '' ).default( '' )
} );

exports.followingUpdates = Joi.object().keys( {
    name: Joi.string().required(),
    users_count: Joi.number().integer().min( 0 ).max( 100 ).default( 3 ),
    wobjects_count: Joi.number().integer().min( 0 ).max( 100 ).default( 3 )
} );

exports.followingUsersUpdates = Joi.object().keys( {
    name: Joi.string().required(),
    limit: Joi.number().integer().min( 0 ).max( 100 ).default( 3 ),
    skip: Joi.number().integer().min( 0 ).max( 100 ).default( 0 )
} );

exports.followingWobjectsUpdates = Joi.object().keys( {
    name: Joi.string().required(),
    limit: Joi.number().integer().min( 0 ).max( 100 ).default( 3 ),
    skip: Joi.number().integer().min( 0 ).max( 100 ).default( 0 ),
    object_type: Joi.string().invalid( '' ).required()
} );

exports.getFollowers = Joi.object().keys( {
    name: Joi.string().required(),
    limit: Joi.number().integer().min( 0 ).default( 30 ),
    skip: Joi.number().integer().min( 0 ).default( 0 )
} );
