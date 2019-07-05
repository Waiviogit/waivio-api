const UserWobjects = require( '../../../models/UserWobjects' );
const User = require( '../../../models/UserModel' );
const { userUtil: userSteemUtil } = require( '../../steemApi' );

const makePipeline = ( { name } ) => {
    let pipeline = [
        {
            $match: { name: name }
        },
        {
            $addFields: {
                objects_following_count: { $size: '$objects_follow' }
            }
        },
        {
            $lookup: {
                from: 'user_wobjects',
                as: 'objects_shares',
                let: { name: '$name' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: [ '$user_name', '$$name' ] }
                        }
                    },
                    { $count: 'count' }
                ]
            }
        }
    ];

    return pipeline;
};

const getOne = async function ( name ) {
    const { userData, error: steemError } = await userSteemUtil.getAccount( name ); // get user data from STEEM blockchain

    if ( steemError ) {
        return { steemError };
    }
    const { result: [ user ], error: dbError } = await User.aggregate( makePipeline( { name } ) ); // get user data from db

    if ( dbError ) {
        return { dbError };
    }

    if ( !user ) {
        return { userData };
    }
    user.objects_shares_count = user.objects_shares[ 0 ].count;
    delete user.objects_shares;

    Object.assign( userData, user ); // combine data from db and blockchain
    return { userData };
};

module.exports = { getOne };
