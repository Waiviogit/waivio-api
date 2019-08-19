const { global: { getGlobalSearch } } = require( '../utilities/operations/search' );
const validators = require( './validators' );

const globalSearchController = async function( req, res, next ) {
    const value = validators.validate( {
        searchString: req.body.string,
        userLimit: req.body.userLimit,
        wobjectsLimit: req.body.wobjectsLimit,
        objectsTypeLimit: req.body.objectsTypeLimit,
        sortByApp: req.body.sortByApp
    }, validators.generalSearch.generalSearchSchema, next );

    if( !value ) {
        return ;
    }
    const result = await getGlobalSearch( value );

    res.result = { status: 200, json: result };
    next();
};

module.exports = { globalSearch: globalSearchController };
