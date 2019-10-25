const { App } = require( '../models' );

const show = async( req, res, next ) => {
    const data = {
        name: req.params.appName || 'waiviodev'
    };
    const { app, error } = await App.getOne( data );

    if( error ) {
        return next( error );
    }
    res.status( 200 ).json( app );
};

module.exports = { show };
