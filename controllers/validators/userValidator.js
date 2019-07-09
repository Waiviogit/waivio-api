const Joi = require( 'joi' );

exports.indexSchema = Joi.object().keys( {
    limit: Joi.number().integer().min( 1 ).default( 30 ),
    skip: Joi.number().integer().min( 0 ).default( 0 ),
    sample: Joi.boolean().truthy( 'true' )
} );

exports.objectsSharesSchema = Joi.object().keys( {
    limit: Joi.number().integer().min( 1 ).max( 100 ).default( 30 ),
    skip: Joi.number().integer().min( 0 ).max( 99 ).default( 0 ),
    locale: Joi.string().default( 'en-US' ),
    name: Joi.string().required(),
    object_types: Joi.array().items( Joi.string().required() ).default( null ),
    exclude_object_types: Joi.array().items( Joi.string().required() ).default( null )
} );
