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

exports.showSchema = Joi.string().required();

exports.objectsFollowSchema = Joi.object().keys( {
    name: Joi.string().required(),
    locale: Joi.string().default( 'en-US' ),
    limit: Joi.number().min( 0 ).max( 100 ).default( 50 ),
    skip: Joi.number().min( 0 ).default( 0 )
} );

exports.objectsFeedSchema = Joi.object().keys( {
    user: Joi.string().required(),
    limit: Joi.number().min( 0 ).max( 50 ).default( 30 ),
    skip: Joi.number().min( 0 ).default( 0 )
} );

exports.feedSchema = Joi.object().keys( {
    name: Joi.string().required(),
    limit: Joi.number().min( 0 ).max( 50 ).default( 20 ),
    count_with_wobj: Joi.number().min( 0 ).default( 0 ),
    start_author: Joi.string(),
    start_permlink: Joi.string(),
    filter: Joi.object().keys( {
        byApp: Joi.string()
    } )
} );

exports.generalSearchSchema = Joi.object().keys( {
    searchString: Joi.string(),
    userLimit: Joi.number().min( 0 ).max( 100 ).default( 5 ),
    wobjectsLimit: Joi.number().min( 0 ).max( 100 ).default( 5 ),
    objectsTypeLimit: Joi.number().min( 0 ).max( 100 ).default( 5 )
} );

