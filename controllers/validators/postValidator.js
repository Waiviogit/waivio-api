const Joi = require( 'joi' );

exports.showSchema = Joi.object().keys( {
    author: Joi.string().required(),
    permlink: Joi.string().required()
} );

exports.getPostsByCategorySchema = Joi.object().keys( {
    category: Joi.string().valid( [ 'trending', 'created', 'hot', 'blog', 'feed', 'promoted' ] ).default( 'trending' ),
    tag: Joi.string(),
    limit: Joi.number().integer().min( 0 ).max( 50 ).default( 20 ),
    start_author: Joi.string(),
    start_permlink: Joi.string()
} );
