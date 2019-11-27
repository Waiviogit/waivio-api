const { schema } = require( './schema' );
const { Post: PostService } = require( '../../../models' );
const { postHelper } = require( '../../../utilities/helpers' );
const _ = require( 'lodash' );

/**
 * Middleware which fill some specific info on each post before send those to client.
 * - fill wobjects on post by full info about wobjects(with fields and others);
 * - add current "author_wobjects_weight" to each post;
 * @param req express request
 * @param res express response
 * @param next express func. get control to next middleware
 * @returns {Promise<void>}
 */
exports.fill = async ( req, res, next ) => {
    const current_schema = schema.find( ( s ) => s.path === req.route.path && s.method === req.method );

    if( !current_schema ) {
        next();
        return;
    }
    // separate requests which return array of posts and which return single post
    if( _.isArray( res.result.json ) ) {
        // replace reblog post blank to source post
        await postHelper.fillReblogs( res.result.json );
        // fill wobjects on post by full info about wobjects(with fields and others);
        res.result.json = await PostService.fillObjects( res.result.json );
        // add current "author_wobjects_weight" to each post;
        await postHelper.addAuthorWobjectsWeight( res.result.json );
    } else {
        // replace reblog post blank to source post
        await postHelper.fillReblogs( [ res.result.json ] );
        // fill wobjects on post by full info about wobjects(with fields and others);
        [ res.result.json ] = await PostService.fillObjects( [ res.result.json ] );
        // add current "author_wobjects_weight" to each post;
        await postHelper.addAuthorWobjectsWeight( [ res.result.json ] );
    }

    next();
};
