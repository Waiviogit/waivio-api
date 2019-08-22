const Joi = require( 'joi' );
const { OBJECT_TYPE_TOP_WOBJECTS_COUNT } = require( '../../utilities/constants' );

exports.indexSchema = Joi.object().keys( {
    limit: Joi.number().min( 0 ),
    skip: Joi.number().min( 0 ).default( 0 ),
    wobjects_count: Joi.number().min( 1 ).max( OBJECT_TYPE_TOP_WOBJECTS_COUNT ).default( 3 )
} );

exports.showSchema = Joi.object().keys( {
    name: Joi.string().required(),
    wobjLimit: Joi.number().min( 0 ).default( 30 ),
    wobjSkip: Joi.number().min( 0 ).default( 0 ),
    filter: Joi.object( { map: Joi.object().keys( {
        coordinates: Joi.array()
            .ordered( [
                Joi.number() .min( -90 ) .max( 90 ),
                Joi.number() .min( -180 ) .max( 180 )
            ] ),
        radius: Joi.number().min( 0 )
    } ) } ).pattern( /.+/, Joi.array().items( Joi.string() ) )
} );
