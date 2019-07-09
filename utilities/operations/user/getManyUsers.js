const { User } = require( '../../../models' );

const makePipeline = ( { limit, skip, sample } ) => {
    const pipeline = [
        { $sort: { wobjects_weight: -1 } },
        { $skip: sample ? 0 : skip },
        { $limit: sample ? 100 : limit }
    ];

    if( sample ) {
        pipeline.push( { $sample: { size: 5 } } );
    }
    return pipeline;
};

const getUsers = async ( { limit, skip, sample } ) => {
    const pipeline = makePipeline( { limit, skip, sample } );
    const { result: users, error } = await User.aggregate( pipeline );

    if( error ) {
        return { error };
    }
    return { users };
};

module.exports = {
    getUsers
};
