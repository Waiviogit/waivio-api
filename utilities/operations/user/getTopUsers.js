const UserWobjects = require( '../../../models/UserWobjects' );

const makePipeline = () => {
    return [
        { $group: { _id: '$user_name', weight: { $sum: '$weight' } } },
        { $sort: { weight: -1 } },
        { $limit: 100 },
        { $project: { _id: 0, name: '$_id', weight: 1 } }
    ];
};

const getUsers = async () => {
    const pipeline = makePipeline();
    const { result: users, error } = await UserWobjects.aggregate( pipeline );

    if( error ) {
        return { error };
    }

    return { users };
};

module.exports = { getUsers };
