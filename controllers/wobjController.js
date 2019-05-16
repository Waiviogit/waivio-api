const { Wobj } = require( '../models' );
const { Post } = require( '../models' );
const followersHelper = require( '../utilities/helpers' ).followersHelper;

const index = async function ( req, res, next ) {
    const { wObjectsData, hasMore, error } = await Wobj.getAll( {
        user_limit: req.body.user_limit || 5,
        locale: req.body.locale || 'en-US',
        author_permlinks: req.body.author_permlinks,
        object_types: req.body.object_types,
        required_fields: req.body.required_fields,
        limit: req.body.limit || 30, // field for infinite scroll
        skip: req.body.skip || 0
    } );

    if ( error ) {
        return next( error );
    }
    res.status( 200 ).json( { wobjects: wObjectsData, hasMore } );
};

const show = async function ( req, res, next ) {
    const data = {
        author_permlink: req.params.authorPermlink,
        locale: req.query.locale,
        required_fields: req.query.required_fields,
        user: req.query.user
    };
    // const {wObjectData, error} = await wObjectHelper.combinedWObjectData(data);
    const { wObjectData, error } = await Wobj.getOne( data );

    if ( error ) {
        return next( error );
    }
    res.status( 200 ).json( wObjectData );
};

const posts = async function ( req, res, next ) {
    const data = {
        author_permlink: req.params.authorPermlink, // for wObject
        limit: req.body.limit || 30, //
        skip: req.body.skip || 0, // for infinite scroll
        locale: req.body.locale || 'en-US'
    };
    const { posts: wobjectPosts, error } = await Post.getByObject( data );

    if ( error ) {
        return next( error );
    }
    res.status( 200 ).json( wobjectPosts );
};

const feed = async function ( req, res, next ) {
    const data = {
        filter: req.body.filter,
        limit: req.body.limit || 30, //
        skip: req.body.skip || 0 // for infinite scroll
    };
    const { posts: AllPosts, error } = await Post.getAllPosts( data );

    if ( error ) {
        return next( error );
    }
    res.status( 200 ).json( AllPosts );
};

const followers = async function ( req, res, next ) {
    const data = {
        author_permlink: req.params.authorPermlink,
        skip: req.body.skip ? req.body.skip : 0,
        limit: req.body.limit ? req.body.limit : 30
    };
    const { followers: wobjectFollowers, error } = await followersHelper.getFollowers( data );

    if ( error ) {
        return next( error );
    }
    res.status( 200 ).json( wobjectFollowers );
};

const search = async function ( req, res, next ) {
    const data = {
        string: req.body.search_string,
        limit: req.body.limit || 10,
        skip: req.body.skip || 0,
        locale: req.body.locale ? req.body.locale : 'en-US',
        object_type: req.body.object_type
    };
    const { wObjectsData, error } = await Wobj.search( data );

    if ( error ) {
        return next( error );
    }
    res.status( 200 ).json( wObjectsData );
};

const fields = async function ( req, res, next ) {
    const data = {
        author_permlink: req.params.authorPermlink
    };
    const { fieldsData, error } = await Wobj.getFields( data );

    if ( error ) {
        return next( error );
    }
    res.status( 200 ).json( fieldsData );
};

const gallery = async function ( req, res, next ) {
    const { gallery: wobjectGallery, error } = await Wobj.getGalleryItems( {
        author_permlink: req.params.authorPermlink
    } );

    if ( error ) {
        return next( error );
    }
    res.status( 200 ).json( wobjectGallery );
};

const list = async function ( req, res, next ) {
    const { wobjects, error } = await Wobj.getList( req.params.authorPermlink );

    if( error ) {
        return next( error );
    }
    res.status( 200 ).json( wobjects );
};

const objectExpertise = async function ( req, res, next ) {
    const data = {
        author_permlink: req.params.authorPermlink,
        skip: req.body.skip || 0,
        limit: req.body.limit || 5
    };
    const { users, error } = await Wobj.getObjectExpertise( data );

    if( error ) {
        return next( error );
    }
    res.status( 200 ).json( users );
};

module.exports = { index, show, posts, search, fields, followers, gallery, feed, list, objectExpertise };
