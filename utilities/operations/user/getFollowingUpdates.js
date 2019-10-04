const { User: UserService, Wobj: WobjectService } = require( '../../../models' );

const getUpdatesSummary = async ( { name, users_count = 3, wobjects_count = 3 } ) => {
    const { user, error: getUserError } = await UserService.getOne( name );
    if( getUserError || !user ) return { error: getUserError || { status: 404, message: 'User not found!' } };

    const { users_updates } = await getUpdatesByUsersList( { users_follow: user.users_follow, limit: users_count } );

    return { result: { users_updates } };
};

const getUsersUpdates = async ( { name, skip, limit } ) => {
    const { user, error: getUserError } = await UserService.getOne( name );
    if( getUserError || !user ) return { error: getUserError || { status: 404, message: 'User not found!' } };

    return await getUpdatesByUsersList( { users_follow: user.users_follow, skip, limit } );
};

const getUpdatesByUsersList = async ( { users_follow = [], limit = 3, skip = 0 } ) => {
    const { result = [], error } = await UserService.aggregate( [
        { $match: { name: { $in: users_follow } } },
        { $addFields: { priority: { $cond: { if: { $gt: [ '$last_posts_count', 0 ] }, then: 1, else: 0 } } } },
        { $sort: { priority: -1, wobjects_weight: -1 } },
        { $skip: skip },
        { $limit: limit + 1 },
        { $project: { _id: 0, name: 1, last_posts_count: 1, wobjects_weight: 1 } }
    ] );
    if( error ) return { error };

    return { users_updates: { users: result.slice( 0, limit ) }, hasMore: result.length > limit };
};

module.exports = { getUpdatesSummary, getUsersUpdates };
