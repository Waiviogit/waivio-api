const Joi = require( 'joi' );
const { OBJECT_TYPE_TOP_WOBJECTS_COUNT, OBJECT_TYPE_TOP_EXPERTS_COUNT } = require( '../../utilities/constants' );

exports.indexSchema = Joi.object().keys( {
    limit: Joi.number().min( 0 ),
    skip: Joi.number().min( 0 ).default( 0 ),
    wobjects_count: Joi.number().min( 0 ).max( OBJECT_TYPE_TOP_WOBJECTS_COUNT ).default( 0 )
} );

exports.showSchema = Joi.object().keys( {
    name: Joi.string().required(),
    wobjLimit: Joi.number().min( 0 ).default( 30 ),
    wobjSkip: Joi.number().min( 0 ).default( 0 ),
    sort: Joi.string().valid( 'weight', 'proximity' ).default( 'weight' ),
    filter: Joi.object( {
        map: Joi.object().keys( {
            coordinates: Joi
                .array()
                .ordered( [
                    Joi.number() .min( -90 ) .max( 90 ),
                    Joi.number() .min( -180 ) .max( 180 )
                ] ),
            radius: Joi.number().min( 0 )
        } ),
        searchString: Joi.string().invalid( '' )
    } ).pattern( /.+/, Joi.array().items( Joi.string() ) )
} );

exports.expertsSchema = Joi.object().keys( {
    name: Joi.string().required(),
    limit: Joi.number().min( 0 ).max( OBJECT_TYPE_TOP_EXPERTS_COUNT ).default(5),
    skip: Joi.number().min( 0 ).max( OBJECT_TYPE_TOP_EXPERTS_COUNT - 1 ).default( 0 )
} );
