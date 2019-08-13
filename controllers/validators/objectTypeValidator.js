const Joi = require( 'joi' );
const { OBJECT_TYPE_TOP_WOBJECTS_COUNT } = require( '../../utilities/constants' );

exports.indexSchema = Joi.object().keys( {
    limit: Joi.number().min( 0 ),
    skip: Joi.number().min( 0 ).default( 0 ),
    wobjects_count: Joi.number().min( 1 ).max( OBJECT_TYPE_TOP_WOBJECTS_COUNT ).default( 3 )
} );
