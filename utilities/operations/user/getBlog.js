const { User, Post } = require( '../../../models' );
const { postHelper } = require( '../../helpers' );

module.exports = async ( { name, limit, skip, start_author, start_permlink } ) => {
    const { user, error: userError } = await User.getOne( name );
    if( userError ) return { error: userError };
    if( user.auth ) {
        return await getGuestBlog( { name, limit, skip } );
    }
    return await getSteemBlog( { name, limit, start_author, start_permlink } );
};

const getSteemBlog = async ( { name, limit, start_author, start_permlink } ) => {
    return await postHelper.getPostsByCategory( ( {
        category: 'blog',
        tag: name,
        limit, start_author, start_permlink
    } ) );
};
const getGuestBlog = async ( { name, skip, limit } ) => {
    return await Post.getBlog( { name, skip, limit } );
};
