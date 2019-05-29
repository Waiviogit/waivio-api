const { ObjectType } = require( '../models' );
const { objectTypeHelper } = require( '../utilities/helpers' );

const index = async ( req, res, next ) => {
    const { objectTypes, error } = await ObjectType.getAll( {
        limit: req.body.limit || 30,
        skip: req.body.skip || 0,
        wobjects_count: req.body.wobjects_count || 3
    } );

    if( error ) {
        return next( error );
    }
    res.status( 200 ).json( objectTypes );
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
    res.status( 200 ).json( objectType );
};

const search = async ( req, res, next ) => {
    const { objectTypes, error } = await ObjectType.search( {
        string: req.body.search_string,
        skip: req.body.skip || 0,
        limit: req.body.limit || 30
    } );

    if( error ) {
        return next( error );
    }
    res.status( 200 ).json( objectTypes );
};

module.exports = { index, search, show };
