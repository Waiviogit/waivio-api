const { postHelper } = require( '../../helpers' );

module.exports = async ( { name, limit, start_author, start_permlink } ) => {
    let { posts, error } = await postHelper.getPostsByCategory( ( {
        category: 'blog',
        tag: name,
        limit, start_author, start_permlink
    } ) );
    return { posts, error };
};
