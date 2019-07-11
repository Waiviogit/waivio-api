const express = require( 'express' );
const morgan = require( 'morgan' );
const cors = require( 'cors' );
const bodyParser = require( 'body-parser' );
const { routes } = require( './routes' );
const { moderateWobjects } = require( './utilities/operations/moderation' );

const app = express();

app.use( cors() );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( morgan( 'dev' ) );
app.use( '/', routes );
app.use( '/', moderateWobjects.moderate );

// error handler
app.use( ( err, req, res, next ) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get( 'env' ) === 'development' ? err : {};

    // render the error page
    res.status( err.status || 500 ).json( { message: err.message } );
} );


module.exports = app;
