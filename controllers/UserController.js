const { User } = require( '../models' );
const { userFeedHelper, getWobjectPostWriters } = require( '../utilities/helpers' );
const { authorise } = require( '../utilities/authorization/authoriseUser' );
const { getManyUsers, objectsShares, getOneUser, getUserFeed, updateMetadata, getComments,
    getMetadata, getBlog, getFollowingUpdates, getPostFilters, getFollowers, getFollowingsUser } = require( '../utilities/operations/user' );
const { users: { searchUsers: searchByUsers } } = require( '../utilities/operations/search' );
const validators = require( './validators' );

const index = async function ( req, res, next ) {
    const value = validators.validate(
        {
            limit: req.query.limit,
            skip: req.query.skip,
            sample: req.query.sample
        }, validators.user.indexSchema, next );
    if( !value ) return ;

    const { users, error } = await getManyUsers( value );
    if( error ) return next( error );

    res.result = { status: 200, json: users };
    next();
};

const show = async function ( req, res, next ) {
    const value = validators.validate( {
        name: req.params.userName,
        with_followings: req.query.with_followings
    }, validators.user.showSchema, next );

    await authorise( value );
    const { userData, error } = await getOneUser( value );
    if( error ) return next( error );

    res.result = { status: 200, json: userData };
    next();
};

const updateUserMetadata = async function ( req, res, next ) {
    const value = validators.validate( {
        user_name: req.params.userName,
        user_metadata: req.body.user_metadata || req.body.data.user_metadata
    }, validators.user.updateMetadataSchema, next );
    if( !value ) return ;

    const { error: authError } = await authorise( value.user_name );
    if( authError ) return next( authError );

    const { user_metadata, error } = await updateMetadata( value );

    if ( error ) return next( error );
    res.result = { status: 200, json: { user_metadata } };
    next();
};

const getUserMetadata = async function ( req, res, next ) {
    const { user_metadata, error } = await getMetadata( req.params.userName );

    if ( error ) return next( error );
    res.result = { status: 200, json: { user_metadata } };
    next();
};

const objects_follow = async function ( req, res, next ) {
    const value = validators.validate( {
        name: req.params.userName,
        locale: req.body.locale,
        limit: req.body.limit,
        skip: req.body.skip
    }, validators.user.objectsFollowSchema, next );
    if( !value ) return ;

    const { wobjects, error } = await User.getObjectsFollow( value );
    if( error ) return next( error );

    res.result = { status: 200, json: wobjects };
    next();
};

const users_follow = async function ( req, res, next ) {
    const value = validators.validate( {
        name: req.params.userName,
        limit: req.query.limit,
        skip: req.query.skip
    }, validators.user.usersFollowSchema, next );
    if( !value ) return ;

    const { result, error } = await getFollowingsUser( value );
    if( error ) return next( error );

    res.result = { status: 200, json: result };
    next();
};

const objects_feed = async function ( req, res, next ) {
    const value = validators.validate( {
        user: req.params.userName,
        skip: req.body.skip,
        limit: req.body.limit
    }, validators.user.objectsFeedSchema, next );
    if( !value ) return ;

    const { posts, error } = await userFeedHelper.feedByObjects( value );
    if( error ) return next( error );

    res.result = { status: 200, json: posts };
    next();
};

const feed = async function ( req, res, next ) {
    const value = validators.validate( {
        name: req.params.userName,
        skip: req.body.skip,
        limit: req.body.limit,
        filter: req.body.filter,
        user_languages: req.body.user_languages
    }, validators.user.feedSchema, next );
    if( !value ) return ;

    const { posts, error } = await getUserFeed( value );
    if( error ) return next( error );

    res.result = { status: 200, json: posts };
    next();
};

const blog = async function ( req, res, next ) {
    const value = validators.validate( {
        name: req.params.userName, ...req.body
    }, validators.user.blogSchema, next );
    if( !value ) return ;

    const { posts, error } = await getBlog( value );
    if( error ) return next( error );

    res.result = { status: 200, json: posts };
    next();
};

const userObjectsShares = async function( req, res, next ) {

    const value = validators.validate(
        {
            name: req.params.userName,
            limit: req.body.limit,
            skip: req.body.skip,
            locale: req.body.locale,
            exclude_object_types: req.body.exclude_object_types,
            object_types: req.body.object_types
        }, validators.user.objectsSharesSchema, next );
    if( !value ) return ;

    const { objects_shares, error } = await objectsShares.getUserObjectsShares( value );
    if( error ) return next( error );

    res.result = { status: 200, json: objects_shares };
    next();
};

const postFilters = async function( req, res, next ) {

    const value = validators.validate(
        {
            name: req.params.userName,
            limit: req.query.limit,
            skip: req.query.skip
        }, validators.user.getPostFiltersSchema, next );
    if( !value ) return ;

    const { posts, error } = await getPostFilters( value );
    if( error ) return next( error );

    res.result = { status: 200, json: posts };
    next();
};

const searchUsers = async ( req, res, next ) => {
    const value = validators.validate(
        {
            searchString: req.query.searchString,
            limit: req.query.limit,
            skip: req.query.skip
        }, validators.user.searchSchema, next );
    if( !value ) return ;

    const { users, error } = await searchByUsers( { ...value, string: value.searchString } );
    if( error ) return next( error );

    res.result = { status: 200, json: users };
    next();
};

const followingUpdates = async ( req, res, next ) => {
    const value = validators.validate( {
        name: req.params.userName,
        users_count: req.query.users_count,
        wobjects_count: req.query.wobjects_count
    }, validators.user.followingUpdates, next );
    if( !value ) return ;

    const { result, error } = await getFollowingUpdates.getUpdatesSummary( value );
    if( error ) return next( error );

    res.result = { status: 200, json: result };
    next();
};

const followingUsersUpdates = async ( req, res, next ) => {
    const value = validators.validate( {
        name: req.params.userName,
        limit: req.query.limit,
        skip: req.query.skip
    }, validators.user.followingUsersUpdates, next );
    if( !value ) return ;

    const { users_updates, error } = await getFollowingUpdates.getUsersUpdates( value );
    if( error ) return next( error );

    res.result = { status: 200, json: users_updates };
    next();
};

const followingWobjectsUpdates = async ( req, res, next ) => {
    const value = validators.validate( {
        name: req.params.userName,
        limit: req.query.limit,
        skip: req.query.skip,
        object_type: req.query.object_type
    }, validators.user.followingWobjectsUpdates, next );
    if( !value ) return ;

    const { wobjects_updates, error } = await getFollowingUpdates.getWobjectsUpdates( value );
    if( error ) return next( error );

    res.result = { status: 200, json: wobjects_updates };
    next();
};

const followers = async ( req, res, next ) => {
    const value = validators.validate( {
        name: req.params.userName,
        limit: req.query.limit,
        skip: req.query.skip
    }, validators.user.getFollowers, next );
    if( !value ) return ;

    const { result, error } = await getFollowers( value );
    if( error ) return next( error );

    res.result = { status: 200, json: result };
    next();
};

const getUserComments = async ( req, res, next ) => {
    const value = validators.validate( {
        name: req.params.userName,
        limit: req.query.limit,
        skip: req.query.skip,
        start_permlink: req.query.start_permlink
    }, validators.user.comments, next );
    if( !value ) return ;

    const { comments, error } = await getComments( value );
    if( error ) return next( error );

    res.result = { status: 200, json: comments };
    next();
};

const wobjectPostWriters = async function ( req, res, next ) {
    if ( !req.params.userName ) return next( { error: { status: 422, message: 'Invalid data in request' } } );

    const { users, error } = await getWobjectPostWriters.getUsersList( req.params.userName );
    if( error ) return next( error );

    res.result = { status: 200, json: users };
    next();
};


module.exports = {
    index, show, objects_follow, users_follow, objects_feed, feed, userObjectsShares, searchUsers, updateUserMetadata,
    getUserMetadata, blog, followingUpdates, followingUsersUpdates, followingWobjectsUpdates, postFilters, followers,
    getUserComments, wobjectPostWriters
};
