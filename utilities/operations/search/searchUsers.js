const { User } = require( '../../../models' );
const { searchUserByName } = require( '../../steemApi/userUtil' );

const makeCountPipeline = ( { string } ) => {
    return [
        { $match: { name: { $regex: `${string}`, $options: 'i' } } },
        { $count: 'count' }
    ];
};

exports.searchUsers = async ( { string, limit } ) => {
    const { accounts, error } = await searchUserByName( string, limit );
    const { result: [ { count: usersCount = 0 } = {} ] = [], error: countError } = await User.aggregate( makeCountPipeline( { string } ) );

    return { users: accounts, usersCount, error: error || countError };
};
