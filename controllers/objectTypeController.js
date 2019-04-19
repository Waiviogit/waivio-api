const { ObjectType } = require( '../models' );

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
    const { objectType, error } = await ObjectType.getOne( {
        name: req.params.objectTypeName,
        wobjects_count: Number( req.query.wobjects_count ) || 3
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
