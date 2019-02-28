const {client} = require('./steem');

const getPostsByTrending = async (data) => {
    try {
        data.limit = !data.limit ? 10 : data.limit;
        const posts = await client.database.getDiscussions('trending', {
            limit: data.limit,
            tag: data.tag,
            start_author: data.start_author,
            start_permlink: data.start_permlink
        });
        return {posts: posts};
    } catch (error) {
        return {error};
    }
};

const getPostsByFeed = async (data) => {
    try {
        data.limit = !data.limit ? 10 : data.limit;
        const posts = await client.database.getDiscussions('feed', {
            limit: data.limit,
            tag: data.user,
            start_author: data.start_author,
            start_permlink: data.start_permlink
        });
        return {posts: posts};
    } catch (error) {
        return {error};
    }
};

const getPost = async (author, permlink) => {
    const post = await client.database.call('get_content', [author, permlink]);
    if (post.author)
        return {post};
    else
        return {error: {message: 'Post not found!', status: 404}}
};


module.exports = {getPostsByTrending, getPostsByFeed, getPost};