const config = require( '../config' );
const mongoose = require( 'mongoose' );
const URI = `mongodb://${config.db.host}:${config.db.port}/${config.db.database}`;

mongoose.connect( URI, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true } )
    .then( () => console.log( 'connection successful!' ) )
    .catch( ( error ) => console.log( error ) );

mongoose.connection.on( 'error', console.error.bind( console, 'MongoDB connection error:' ) );

mongoose.Promise = global.Promise;
mongoose.set( 'debug', process.env.NODE_ENV === 'development' );

module.exports = { Mongoose: mongoose,
    models: {
        UserWobjects: require( './schemas/UserWobjectsSchema' ),
        CommentRef: require( './schemas/CommentRefSchema' ),
        ObjectType: require( './schemas/ObjectTypeSchema' ),
        WObject: require( './schemas/wObjectSchema' ),
        Comment: require( './schemas/CommentSchema' ),
        User: require( './schemas/UserSchema' ),
        Post: require( './schemas/PostSchema' ),
        App: require( './schemas/AppSchema' )
    }
};
