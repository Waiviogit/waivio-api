const Joi = require( 'joi' );

exports.generalSearchSchema = Joi.object().keys( {
    searchString: Joi.string(),
    userLimit: Joi.number().integer().min( 0 ).max( 100 ).default( 5 ),
    wobjectsLimit: Joi.number().integer().min( 0 ).max( 100 ).default( 5 ),
    objectsTypeLimit: Joi.number().integer().min( 0 ).max( 100 ).default( 5 ),
    sortByApp: Joi.string().allow( '' ).default( null )
} );
