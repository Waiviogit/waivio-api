const Joi = require( 'joi' );
const { LANGUAGES } = require( '../../utilities/constants' );

exports.showSchema = Joi.object().keys( {
    author: Joi.string().required(),
    permlink: Joi.string().required()
} );

exports.getPostsByCategorySchema = Joi.object().keys( {
    category: Joi.string().valid( [ 'trending', 'created', 'hot' ] ).default( 'trending' ),
    skip: Joi.number().integer().min( 0 ).default( 0 ),
    limit: Joi.number().integer().min( 0 ).max( 50 ).default( 20 ),
    user_languages: Joi.array().items( Joi.string().valid( [ ...LANGUAGES ] ) ).default( [] )
} );
