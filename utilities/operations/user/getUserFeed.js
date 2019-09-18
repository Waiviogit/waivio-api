const { User, Post } = require( '../../../models' );
const { postHelper } = require( '../../helpers' );

const getFeed = async function ( { name, limit = 20, skip = 0, user_languages } ) {
    const { user, error: userError } = await User.getOne( name );

    if( userError || !user ) {
        return { error: userError || { status: 404, message: 'User not found!' } };
    }

    let { posts, error: postsError } = await Post.getByFollowLists( {
        users: user.users_follow,
        author_permlinks: user.objects_follow,
        user_languages, skip, limit
    } );

    if( postsError ) return { error: postsError };

    posts = await Post.fillObjects( posts ); // format wobjects on each post
    await postHelper.addAuthorWobjectsWeight( posts ); // add to each post author his weight in wobjects
    return { posts };
};

module.exports = getFeed;
