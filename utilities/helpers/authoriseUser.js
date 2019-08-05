const { getNamespace } = require( 'cls-hooked' );
const authoriseSteemconnect = require( '../steemconnect/authorise' );

exports.authorise = async ( username ) => {
    const session = getNamespace( 'request-session' );
    const { user_name: token_user_name } = await authoriseSteemconnect.authoriseUser( session.get( 'access-token' ) );

    if( token_user_name && token_user_name === username ) {
        session.set( 'authorised_user', username );
        return {};
    }
    return { error: { status: 401, message: 'Token not valid!' } };
};
