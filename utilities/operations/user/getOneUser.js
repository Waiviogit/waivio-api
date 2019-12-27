const { User } = require( '../../../database' ).models;
const { userUtil: userSteemUtil } = require( '../../steemApi' );
const _ = require( 'lodash' );

const getDbUser = async ( name ) => {
    try {
        const user = await User
            .findOne( { name } )
            .populate( 'followers_count' )
            .populate( 'objects_shares_count' );
        if( user ) return { user: user.toJSON() };
    } catch ( error ) {
        return { error };
    }
};

const getOne = async function ( { name, with_followings } ) {
    const { userData = {} } = await userSteemUtil.getAccount( name ); // get user data from STEEM blockchain

    let { user, error: dbError } = await getDbUser( name ); // get user data from db

    if( !with_followings ) {
        user = _.omit( user, [ 'users_follow', 'objects_follow' ] );
    }
    if ( dbError || ( !user && _.isEmpty( userData ) ) ) {
        return { error: dbError || { status: 404, message: `User ${name} not found!` } };
    }

    if ( !user ) return { userData };

    Object.assign( userData, user ); // combine data from db and blockchain
    return { userData };
};

module.exports = getOne;
