const { postHelper } = require( '../utilities/helpers' );

const show = async function ( req, res, next ) {
    const { post, error } = await postHelper.getPost( req.params.author, req.params.permlink );

    if ( error ) {
        return next( error );
    }
    res.status( 200 ).json( post );
};

const getPostsByCategory = async function ( req, res, next ) {
    const { posts, error } = await postHelper.getPostsByCategory( {
        category: req.body.category || 'trending',
        tag: req.body.tag,
        limit: req.body.limit || 20,
        start_author: req.body.start_author,
        start_permlink: req.body.start_permlink
    } );

    if ( error ) {
        return next( error );
    }
    res.status( 200 ).json( posts );
};

module.exports = { show, getPostsByCategory };
