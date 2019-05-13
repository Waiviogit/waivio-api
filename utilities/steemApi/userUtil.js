const { client, clientAnyx } = require( './steem' );

const getAccount = async ( name ) => {
    try {
        const [ account ] = await client.database.getAccounts( [ name ] );

        if ( !account ) {
            return { error: { status: 404, message: 'User not found!' } };
        }
        return { userData: account };
    } catch ( error ) {
        return { error };
    }
};

const getFollowingsList = async ( name ) => {
    try {
        const followings = await client.call( 'follow_api', 'get_following', [ name, '', 'blog', 1000 ] );

        return { followings };
    } catch ( error ) {
        return { error };
    }
};

const searchUserByName = async ( name, limit = 20 ) => {
    try{
        const accounts = await clientAnyx.call( 'condenser_api', 'get_account_reputations', [ name, limit ] );

        return { accounts };
    } catch ( e ) {
        return { error: e };
    }
};

module.exports = { getAccount, getFollowingsList, searchUserByName };
