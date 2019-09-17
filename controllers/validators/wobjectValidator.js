const Joi = require( 'joi' );

exports.showSchema = Joi.object().keys( {
    author_permlink: Joi.string().required(),
    locale: Joi.string(),
    required_fields: [ Joi.string() ]
} );

exports.indexSchema = Joi.object().keys( {
    limit: Joi.number().integer().min( 1 ).max( 500 ).default( 30 ),
    skip: Joi.number().integer().min( 0 ).default( 0 ),
    user_limit: Joi.number().integer().min( 0 ).max( 100 ).default( 5 ),
    locale: Joi.string().default( 'en-US' ),
    author_permlinks: Joi.array().items( Joi.string() ),
    object_types: Joi.array().items( Joi.string() ),
    exclude_object_types: Joi.array().items( Joi.string() ),
    required_fields: Joi.array().items( Joi.string() ).default( [] ),
    sample: Joi.boolean()
} );

exports.postsScheme = Joi.object().keys( {
    author_permlink: Joi.string().required(),
    limit: Joi.number().integer().min( 1 ).max( 100 ).default( 30 ),
    skip: Joi.number().integer().min( 0 ).default( 0 ),
    user_name: Joi.string()
} );

exports.feedScheme = Joi.object().keys( {
    limit: Joi.number().integer().min( 1 ).max( 100 ).default( 30 ),
    skip: Joi.number().integer().min( 0 ).default( 0 ),
    filter: Joi.object().keys( {
        byApp: Joi.string()
    } )
} );

exports.followersScheme = Joi.object().keys( {
    limit: Joi.number().integer().min( 1 ).max( 100 ).default( 30 ),
    skip: Joi.number().integer().min( 0 ).default( 0 ),
    author_permlink: Joi.string().required()
} );

exports.searchScheme = Joi.object().keys( {
    limit: Joi.number().integer().min( 1 ).max( 100 ).default( 10 ),
    skip: Joi.number().integer().min( 0 ).default( 0 ),
    string: Joi.string().allow( '' ),
    locale: Joi.string().default( 'en-US' ),
    sortByApp: Joi.string().allow( '' ).default( null ),
    object_type: Joi.string(),
    forParent: Joi.string().invalid( '' ).allow( null )
} );

exports.fieldsScheme = exports.galleryScheme = exports.listScheme = Joi.object().keys( {
    author_permlink: Joi.string().required()
} );

exports.objectExpertiseScheme = Joi.object().keys( {
    limit: Joi.number().integer().min( 1 ).max( 100 ).default( 5 ),
    skip: Joi.number().integer().min( 0 ).default( 0 ),
    author_permlink: Joi.string().required(),
    user: Joi.string().allow( '' ).default( null )
} );

exports.getByFieldScheme = Joi.object().keys( {
    fieldName: Joi.string().required(),
    fieldBody: Joi.string().required()
} );

exports.getChildWobjects = Joi.object().keys( {
    limit: Joi.number().integer().min( 1 ).max( 100 ).default( 30 ),
    skip: Joi.number().integer().min( 0 ).default( 0 ),
    author_permlink: Joi.string().required()
} );
