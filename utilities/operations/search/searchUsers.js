const { User } = require( '../../../models' );

const makeCountPipeline = ( { string } ) => {
    return [
        { $match: { name: { $regex: `${string}`, $options: 'i' } } },
        { $count: 'count' }
    ];
};


exports.searchUsers = async ( { string, limit, skip } ) => {
    const { users, error } = await User.search( { string, skip, limit } );
    const { result: [ { count: usersCount = 0 } = {} ] = [], error: countError } = await User.aggregate( makeCountPipeline( { string } ) );

    return {
        users: users.map( ( u ) => ( { account: u.name, wobjects_weight: u.wobjects_weight } ) ),
        usersCount,
        error: error || countError
    };
};
