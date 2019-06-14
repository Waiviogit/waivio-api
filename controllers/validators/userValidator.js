const Joi = require( 'joi' );

exports.indexSchema = Joi.object().keys( {
    limit: Joi.number().integer().min( 1 ).max( 100 ).default( 30 ),
    skip: Joi.number().integer().min( 0 ).max( 99 ).default( 0 ),
    sample: Joi.boolean().truthy( 'true' )
} );
