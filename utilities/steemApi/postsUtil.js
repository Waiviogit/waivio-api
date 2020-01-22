const { client } = require( './steem' );

const getPostsByCategory = async ( data ) => { // data include tag(user if blog), category(trending/blog/new/hot), limit, start author/permlink
    try {
        if ( ![ 'trending', 'created', 'hot', 'blog', 'feed', 'promoted' ].includes( data.category ) ) {
            return { error: { status: 422, message: 'Not valid category, expected: trending, created, hot, blog, feed, promoted!' } };
        }
        const posts = await client.database.getDiscussions( data.category, {
            limit: data.limit || 20,
            tag: data.tag,
            start_author: data.start_author,
            start_permlink: data.start_permlink
        } );

        return { posts };
    } catch ( error ) {
        return { error };
    }
};

/**
 * Return post or comment from steem blockchain if it exist and not deleted
 * @param author
 * @param permlink
 * @returns {Promise<{error: {message: string, status: number}}|{post: ({author}|any)}>}
 */
const getPost = async ( author, permlink ) => {
    const post = await client.database.call( 'get_content', [ author, permlink ] );

    if ( post.author ) {
        return { post };
    }
    return { error: { message: 'Post not found!', status: 404 } };
};


module.exports = { getPostsByCategory, getPost };
