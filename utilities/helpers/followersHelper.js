const WObjectModel = require( '../../database/schemas/wObjectSchema' );
const UserWobjects = require( '../../database/schemas/UserWobjectsSchema' );
const rankHelper = require( './rankHelper' );

const getFollowers = async ( data ) => {
    try {
        const wObject = await WObjectModel.findOne( { author_permlink: data.author_permlink } )
            .populate( {
                path: 'followers',
                options: {
                    limit: data.limit,
                    sort: { name: 1 },
                    skip: data.skip,
                    select: 'name'
                }
            } )
            .lean();

        await formatWobjectFollowers( wObject );
        return { followers: wObject.followers };
    } catch ( error ) {
        return { error };
    }
};

const formatWobjectFollowers = async ( wObject ) => {
    for( const follower of wObject.followers ) {
        let userWobj = await UserWobjects.findOne( { user_name: follower.name, author_permlink: wObject.author_permlink } ).lean();

        follower.weight = userWobj ? userWobj.weight : 0;
        delete follower.objects_follow;
        delete follower._id;
    }
    rankHelper.calculateForUsers( wObject.followers, wObject.weight );
};

module.exports = { getFollowers };

