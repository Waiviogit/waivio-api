const { getNamespace } = require( 'cls-hooked' );
const authoriseSteemconnect = require( '../steemconnect/authorise' );

exports.authorise = async ( username ) => {
    const session = getNamespace( 'request-session' );
    const { user_name: token_user_name } = await authoriseSteemconnect.authoriseUser( session.get( 'access_token' ) );

    if( token_user_name && token_user_name === username ) {
        session.set( 'authorised_user', username );
        console.log();
    }
};
