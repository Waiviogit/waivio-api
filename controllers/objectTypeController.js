const { ObjectType } = require( '../models' );
const { objectTypeHelper } = require( '../utilities/helpers' );
const { searchObjectTypes } = require( '../utilities/operations/search/searchTypes' );
const { getAll } = require( '../utilities/operations/objectType' );
const validators = require( './validators' );

const index = async ( req, res, next ) => {
    const value = validators.validate( {
        limit: req.body.limit,
        skip: req.body.skip,
        wobjects_count: req.body.wobjects_count
    }, validators.objectType.indexSchema, next );

    if( !value ) return;
    const { objectTypes, error } = await getAll( value );

    if( error ) return next( error );
    res.result = { status: 200, json: objectTypes };
    next();
};

const show = async ( req, res, next ) => {
    const { objectType, error } = await objectTypeHelper.getObjectType( {
        name: req.params.objectTypeName,
        wobjLimit: req.body.wobjects_count || 30,
        wobjSkip: req.body.wobjects_skip || 0,
        filter: req.body.filter
    } );

    if( error ) {
        return next( error );
    }
    res.result = { status: 200, json: objectType };
    next();
};

const search = async ( req, res, next ) => {
    const { objectTypes, error } = await searchObjectTypes( {
        string: req.body.search_string,
        skip: req.body.skip || 0,
        limit: req.body.limit || 30
    } );

    if( error ) {
        return next( error );
    }
    res.result = { status: 200, json: objectTypes };
    next();
};

module.exports = { index, search, show };
