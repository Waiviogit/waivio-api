const { User } = require( '../models' );
const { userFeedHelper, generalSearchHelper } = require( '../utilities/helpers' );
const { getManyUsers } = require( '../utilities/operations/user' );
const validators = require( './validators' );

const index = async function ( req, res, next ) {
    const value = validators.validate(
        {
            limit: req.query.limit,
            skip: req.query.skip,
            sample: req.query.sample
        }, validators.wobject.indexSchema, next );

    if( !value ) {
        return ;
    }
    const { users, error } = await getManyUsers.getUsers( value );

    if ( error ) {
        return next( error );
    }
    res.status( 200 ).json( users );
};

const show = async function ( req, res, next ) {
    const { userData, error } = await User.getOne( req.params.userName );

    if ( error ) {
        return next( error );
    }
    res.status( 200 ).json( userData );
};

const objects_follow = async function ( req, res, next ) {
    const data = {
        name: req.params.userName,
        locale: req.body.locale ? req.body.locale : 'en-US',
        limit: req.body.limit ? req.body.limit : 50,
        skip: req.body.skip ? req.body.skip : 0
    };
    const { wobjects, error } = await User.getObjectsFollow( data );

    if ( error ) {
        return next( error );
    }
    res.status( 200 ).json( wobjects );
};

const objects_feed = async function ( req, res, next ) {
    const { posts, error } = await userFeedHelper.feedByObjects( {
        user: req.params.userName,
        skip: req.body.skip ? req.body.skip : 0,
        limit: req.body.limit ? req.body.limit : 30
    } );

    if ( error ) {
        return next( error );
    }
    res.status( 200 ).json( posts );
};

const feed = async function ( req, res, next ) {
    const { result, error } = await userFeedHelper.getCombinedFeed( {
        user: req.params.userName,
        limit: req.body.limit || 20,
        count_with_wobj: req.body.count_with_wobj || 0,
        start_author: req.body.start_author || '',
        start_permlink: req.body.start_permlink || '',
        filter: req.body.filter
    } );

    if ( error ) {
        return next( error );
    }
    res.status( 200 ).json( result );
};

const userObjectsShares = async function( req, res, next ) {
    const { objects_shares, error } = await User.getUserObjectsShares( {
        name: req.params.userName,
        limit: req.body.limit || 30,
        skip: req.body.skip || 0,
        locale: req.body.locale || 'en-US'
    } );

    if( error ) {
        return next( error );
    }
    res.status( 200 ).json( objects_shares );
};

const generalSearch = async function( req, res, next ) {
    const data = {
        searchString: req.body.string,
        userLimit: req.body.userLimit,
        wobjectsLimit: req.body.wobjectsLimit,
        objectsTypeLimit: req.body.objectsTypeLimit
    };
    const result = await generalSearchHelper.search( data );

    res.status( 200 ).json( result );
};

module.exports = { index, show, objects_follow, objects_feed, feed, userObjectsShares, generalSearch };
