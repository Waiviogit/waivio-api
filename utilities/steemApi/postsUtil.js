const { client } = require( './steem' );
const _ = require( 'lodash' );

exports.getPostsByCategory = async ( data ) => { // data include tag(user if blog), category(trending/blog/new/hot), limit, start author/permlink
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
exports.getPost = async ( author, permlink ) => {
    const post = await client.database.call( 'get_content', [ author, permlink ] );

    if ( post.author ) {
        return { post };
    }
    return { error: { message: 'Post not found!', status: 404 } };
};

exports.getManyPosts = async ( links = [] ) => {
    const posts = await Promise.all( links.map( async ( link ) => {
        const { post, error } = await this.getPost( _.get( link, 'author' ), _.get( link, 'permlink' ) );
        if( post && !error ) return post;
    } ) );
    return{ posts: _.compact( posts ) };
};


/**
 * Get comments authored by specified STEEM user
 * @param start_author {String} Specified STEEM user
 * @param start_permlink {String} permlink of last received comment(pagination)
 * @param limit {Number} count of comments to return
 * @returns {Promise<{comments: [Object]}|{error: {message: string, status: number}}>}
 */
exports.getUserComments = async ( { start_author, start_permlink, limit } ) => {
    const comments = await client.database.call(
        'get_discussions_by_comments',
        [ { start_author, start_permlink, limit } ]
    );

    if ( !_.isEmpty( comments ) ) return { comments };
    return { error: { message: 'Comments not found!', status: 404 } };
};
