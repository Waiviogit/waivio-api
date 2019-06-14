const App = require( '../../../models/AppModel' );

const makePipeline = ( { limit, skip, sample } ) => {
    const pipeline = [
        { $match: { name: 'waivio' } },
        { $unwind: '$top_users' },
        { $skip: sample ? 0 : skip },
        { $limit: sample ? 100 : limit },
        { $replaceRoot: { newRoot: '$top_users' } },
        { $lookup: { from: 'users', localField: 'name', foreignField: 'name', as: 'user_data' } },
        { $unwind: '$user_data' },
        { $project: { _id: 0, name: 1, weight: 1, json_metadata: '$user_data.json_metadata' } }
    ];

    if( sample ) {
        pipeline.splice( 4, 0, { $sample: { size: 5 } } );
    }
    return pipeline;
};

const getUsers = async ( { limit, skip, sample } ) => {
    const pipeline = makePipeline( { limit, skip, sample } );
    const { result: users, error } = await App.aggregate( pipeline );

    if( error ) {
        return { error };
    }
    return { users };
};

module.exports = {
    getUsers
};
