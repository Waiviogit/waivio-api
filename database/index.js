const config = require( '../config' );
const mongoose = require( 'mongoose' );
const URI = `mongodb://${config.db.host}:${config.db.port}/${config.db.database}`;

mongoose.connect( URI, { useNewUrlParser: true, useCreateIndex: true } )
    .then( () => console.log( 'connection successful!' ) )
    .catch( ( error ) => console.log( error ) );

mongoose.connection.on( 'error', console.error.bind( console, 'MongoDB connection error:' ) );

mongoose.Promise = global.Promise;
mongoose.set( 'debug', process.env.NODE_ENV === 'development' );

module.exports = { Mongoose: mongoose,
    models: {
        WObject: require( './schemas/wObjectSchema' ),
        User: require( './schemas/UserSchema' ),
        App: require( './schemas/AppSchema' ),
        Post: require( './schemas/PostSchema' ),
        ObjectType: require( './schemas/ObjectTypeSchema' ),
        UserWobjects: require( './schemas/UserWobjectsSchema' )
    }
};
