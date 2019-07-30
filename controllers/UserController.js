const { User } = require( '../models' );
const { userFeedHelper } = require( '../utilities/helpers' );
const { getManyUsers, objectsShares, getOneUser, getUserFeed } = require( '../utilities/operations/user' );
const { users: { searchUsers: searchByUsers } } = require( '../utilities/operations/search' );
const validators = require( './validators' );

const index = async function ( req, res, next ) {
    const value = validators.validate(
        {
            limit: req.query.limit,
            skip: req.query.skip,
            sample: req.query.sample
        }, validators.user.indexSchema, next );

    if( !value ) {
        return ;
    }
    const { users, error } = await getManyUsers.getUsers( value );

    if ( error ) {
        return next( error );
    }
    res.result = { status: 200, json: users };
    next();
};

const show = async function ( req, res, next ) {
    const value = validators.validate( req.params.userName, validators.user.showSchema, next );
    const { userData, error } = await getOneUser.getOne( value );

    if ( error ) {
        return next( error );
    }
    res.result = { status: 200, json: userData };
    next();
};

const objects_follow = async function ( req, res, next ) {
    const value = validators.validate( {
        name: req.params.userName,
        locale: req.body.locale,
        limit: req.body.limit,
        skip: req.body.skip
    }, validators.user.objectsFollowSchema, next );

    if( !value ) {
        return ;
    }
    const { wobjects, error } = await User.getObjectsFollow( value );

    if ( error ) {
        return next( error );
    }
    res.result = { status: 200, json: wobjects };
    next();
};

const objects_feed = async function ( req, res, next ) {
    const value = validators.validate( {
        user: req.params.userName,
        skip: req.body.skip,
        limit: req.body.limit
    }, validators.user.objectsFeedSchema, next );

    if( !value ) {
        return ;
    }
    const { posts, error } = await userFeedHelper.feedByObjects( value );

    if ( error ) {
        return next( error );
    }
    res.result = { status: 200, json: posts };
    next();
};

const feed = async function ( req, res, next ) {
    const value = validators.validate( {
        name: req.params.userName,
        skip: req.body.skip,
        limit: req.body.limit,
        filter: req.body.filter
    }, validators.user.feedSchema, next );

    if( !value ) {
        return ;
    }
    const { posts, error } = await getUserFeed.getFeed( value );

    if ( error ) {
        return next( error );
    }
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

    if( !value ) {
        return ;
    }

    const { objects_shares, error } = await objectsShares.getUserObjectsShares( value );

    if( error ) {
        return next( error );
    }
    res.result = { status: 200, json: objects_shares };
    next();
};

const searchUsers = async ( req, res, next ) => {
    const value = validators.validate(
        {
            searchString: req.query.searchString,
            limit: req.query.limit
        }, validators.user.searchSchema, next );

    if( !value ) {
        return ;
    }

    const { users, error } = await searchByUsers( { ...value, string: value.searchString } );

    if( error ) {
        return next( error );
    }
    res.result = { status: 200, json: users };
    next();
};

module.exports = { index, show, objects_follow, objects_feed, feed, userObjectsShares, searchUsers };
