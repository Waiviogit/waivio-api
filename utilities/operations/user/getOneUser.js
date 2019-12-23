const { User } = require( '../../../database' ).models;
const { userUtil: userSteemUtil } = require( '../../steemApi' );
const _ = require( 'lodash' );

const getDbUser = async ( name ) => {
    try {
        return {
            user: ( await User
                .findOne( { name }, { _id: 0 } )
                .populate( 'followers_count' )
                .populate( 'objects_shares_count' )
            ).toJSON()
        };
    } catch ( error ) {
        return { error };
    }
};

const getOne = async function ( name ) {
    const { userData = {} } = await userSteemUtil.getAccount( name ); // get user data from STEEM blockchain

    const { user, error: dbError } = await getDbUser( name ); // get user data from db

    if ( dbError || ( !user && _.isEmpty( userData ) ) ) {
        return { error: dbError || { status: 404, message: `User ${name} not found!` } };
    }

    if ( !user ) return { userData };

    Object.assign( userData, user ); // combine data from db and blockchain
    return { userData };
};

module.exports = getOne;
