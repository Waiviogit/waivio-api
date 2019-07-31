const sc2 = require( 'sc2-sdk' );

/**
 * Authorise user using token of steemconnect
 * @param {string} token Valid token of steemconnect
 * @returns {string} user_name Return name of owner token if it valid, else undefined
 */
exports.authoriseUser = async ( token ) => {
    if( !token ) {
        return { error: { message: '"token" must exist!' } };
    }
    const api = sc2.Initialize( {
        accessToken: token,
        app: 'busy'
    } );
    let user;

    try {
        user = await api.me();
    } catch ( error ) {
        return { error };
    }

    return { user_name: user._id };
};
