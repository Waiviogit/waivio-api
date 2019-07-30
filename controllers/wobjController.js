const { Wobj } = require( '../models' );
const { Post } = require( '../models' );
const followersHelper = require( '../utilities/helpers' ).followersHelper;
const { objectExperts, wobjectInfo, getManyObjects } = require( '../utilities/operations' ).wobject;
const { wobjects: { searchWobjects } } = require( '../utilities/operations' ).search;
const validators = require( './validators' );

const index = async function ( req, res, next ) {
    const value = validators.validate(
        {
            user_limit: req.body.user_limit,
            locale: req.body.locale,
            author_permlinks: req.body.author_permlinks,
            object_types: req.body.object_types,
            exclude_object_types: req.body.exclude_object_types,
            required_fields: req.body.required_fields,
            limit: req.body.limit,
            skip: req.body.skip,
            sample: req.body.sample
        }, validators.wobject.indexSchema, next );

    if( !value ) {
        return ;
    }
    const { wObjectsData, hasMore, error } = await getManyObjects.getMany( value );

    if ( error ) {
        return next( error );
    }
    res.result = { status: 200, json: { wobjects: wObjectsData, hasMore } };
    next();
};

const show = async function ( req, res, next ) {
    const value = validators.validate(
        {
            author_permlink: req.params.authorPermlink,
            locale: req.query.locale,
            required_fields: req.query.required_fields,
            user: req.query.user
        }, validators.wobject.showSchema, next );

    if( !value ) {
        return ;
    }
    const { wobjectData, error } = await wobjectInfo.getOne( value );

    if ( error ) {
        return next( error );
    }
    res.result = { status: 200, json: wobjectData };
    next();
};

const posts = async function ( req, res, next ) {
    const value = validators.validate(
        {
            author_permlink: req.params.authorPermlink,
            limit: req.body.limit,
            skip: req.body.skip,
            locale: req.body.locale
        }, validators.wobject.postsScheme, next );

    if( !value ) {
        return ;
    }
    const { posts: wobjectPosts, error } = await Post.getByObject( value );

    if ( error ) {
        return next( error );
    }
    res.result = { status: 200, json: wobjectPosts };
    next();
};

const feed = async function ( req, res, next ) {
    const value = validators.validate(
        {
            filter: req.body.filter,
            limit: req.body.limit,
            skip: req.body.skip
        }, validators.wobject.feedScheme, next );

    if( !value ) {
        return ;
    }
    const { posts: AllPosts, error } = await Post.getAllPosts( value );

    if ( error ) {
        return next( error );
    }
    res.result = { status: 200, json: AllPosts };
    next();
};

const followers = async function ( req, res, next ) {
    const value = validators.validate(
        {
            author_permlink: req.params.authorPermlink,
            skip: req.body.skip,
            limit: req.body.limit
        }, validators.wobject.followersScheme, next );

    if( !value ) {
        return ;
    }
    const { followers: wobjectFollowers, error } = await followersHelper.getFollowers( value );

    if ( error ) {
        return next( error );
    }
    res.result = { status: 200, json: wobjectFollowers };
    next();
};

const search = async function ( req, res, next ) {
    const value = validators.validate(
        {
            string: req.body.search_string,
            limit: req.body.limit,
            skip: req.body.skip,
            locale: req.body.locale,
            object_type: req.body.object_type
        }, validators.wobject.searchScheme, next );

    if( !value ) {
        return ;
    }
    const { wobjects, error } = await searchWobjects( value );

    if ( error ) {
        return next( error );
    }
    res.result = { status: 200, json: wobjects };
    next();
};

const fields = async function ( req, res, next ) {
    const value = validators.validate(
        {
            author_permlink: req.params.authorPermlink
        }, validators.wobject.fieldsScheme, next );

    if( !value ) {
        return ;
    }
    const { fieldsData, error } = await Wobj.getFields( value );

    if ( error ) {
        return next( error );
    }
    res.result = { status: 200, json: fieldsData };
    req.author_permlink = req.params.authorPermlink;
    next();
};

const gallery = async function ( req, res, next ) {

    const value = validators.validate(
        {
            author_permlink: req.params.authorPermlink
        }, validators.wobject.galleryScheme, next );

    if( !value ) {
        return ;
    }

    const { gallery: wobjectGallery, error } = await Wobj.getGalleryItems( value );

    if ( error ) {
        return next( error );
    }
    res.result = { status: 200, json: wobjectGallery };
    req.author_permlink = req.params.authorPermlink;
    next();
};

const list = async function ( req, res, next ) {
    const value = validators.validate(
        {
            author_permlink: req.params.authorPermlink
        }, validators.wobject.listScheme, next );

    if( !value ) {
        return ;
    }
    const { wobjects, error } = await Wobj.getList( value.author_permlink );

    if( error ) {
        return next( error );
    }
    res.result = { status: 200, json: wobjects };
    next();
};

const objectExpertise = async function ( req, res, next ) {
    const value = validators.validate(
        {
            author_permlink: req.params.authorPermlink,
            skip: req.body.skip,
            limit: req.body.limit
        }, validators.wobject.objectExpertiseScheme, next );

    if( !value ) {
        return ;
    }
    const { experts, error } = await objectExperts.getWobjExperts( value );

    if( error ) {
        return next( error );
    }
    res.result = { status: 200, json: experts };
    next();
};

module.exports = { index, show, posts, search, fields, followers, gallery, feed, list, objectExpertise };
