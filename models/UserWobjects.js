const UserWobjects = require( '../database' ).models.UserWobjects;

const aggregate = async ( pipeline ) => {
    try {
        const result = await UserWobjects.aggregate( pipeline );

        if( !result ) {
            return { error: { status: 404, message: 'Not found!' } };
        }
        return { result };
    } catch ( error ) {
        return { error };
    }
};

const getByWobject = async( { author_permlink, skip = 0, limit = 30 } ) => {
    try {
        const experts = await UserWobjects.aggregate( [
            { $match: { author_permlink } },
            { $sort: { weight: -1 } },
            { $skip: skip },
            { $limit: limit },
            { $project: { _id: 0, name: '$user_name', weight: 1 } }
        ] );

        if( !experts ) {
            return { error: { status: 404, message: 'Not found!' } };
        }
        return { experts };
    } catch ( error ) {
        return { error };
    }
};

module.exports = {
    aggregate,
    getByWobject
};
