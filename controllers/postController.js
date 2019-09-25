const { postHelper } = require( '../utilities/helpers' );
const { getPostsByCategory } = require( '../utilities/operations' ).post;
const validators = require( './validators' );

const show = async function ( req, res, next ) {
    const value = validators.validate( {
        author: req.params.author,
        permlink: req.params.permlink
    }, validators.post.showSchema, next );

    if( !value ) {
        return ;
    }
    const { post, error } = await postHelper.getPost( value.author, value.permlink );

    if ( error ) {
        return next( error );
    }
    res.result = { status: 200, json: post };
    next();
};

const getByCategory = async function ( req, res, next ) {
    const value = validators.validate( {
        category: req.body.category,
        tag: req.body.tag,
        limit: req.body.limit,
        skip: req.body.skip,
        user_languages: req.body.user_languages
    }, validators.post.getPostsByCategorySchema, next );

    if( !value ) {
        return;
    }
    const { posts, error } = await getPostsByCategory( value );

    if ( error ) {
        return next( error );
    }
    res.result = { status: 200, json: posts };
    next();
};

module.exports = { show, getByCategory };
