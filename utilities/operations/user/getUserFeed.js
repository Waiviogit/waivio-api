const { User, Post } = require( '../../../models' );
const { postHelper } = require( '../../helpers' );

const makePipeline = ( { users = [], author_permlinks = [], skip, limit } ) => {
    return [
        {
            $match: {
                $or: [
                    { author: { $in: users } },
                    { 'wobjects.author_permlink': { $in: author_permlinks } }
                ]
            }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
            $lookup: {
                from: 'wobjects',
                localField: 'wobjects.author_permlink',
                foreignField: 'author_permlink',
                as: 'fullObjects'
            }
        }
    ];
};

const getFeed = async function ( { name, limit = 20, skip = 0 } ) {
    const { user, error: userError } = await User.getOne( name );

    if( userError || !user ) {
        return { error: userError || { status: 404, message: 'User not found!' } };
    }

    let { posts, error } = await Post.aggregate( makePipeline( {
        users: user.users_follow,
        author_permlinks: user.objects_follow,
        limit, skip
    } ) );

    if( error ) {
        return { error };
    }
    posts = await Post.fillObjects( posts ); // format wobjects on each post
    await postHelper.addAuthorWobjectsWeight( posts ); // add to each post author his weight in wobjects
    return { posts };
};

module.exports = { getFeed };
