const {client} = require('./steem');

const getPostsByCategory = async (data) => {    //data include tag(user if blog), category(trending/blog/new/hot), limit, start author/permlink
    try {
        if (!['trending', 'created', 'hot', 'blog', 'feed'].includes(data.category)) {
            return {error: {status: 422, message: 'Not valid category, expected: trending, created, hot, blog, feed!'}};
        }
        const posts = await client.database.getDiscussions(data.category, {
            limit: data.limit || 20,
            tag: data.tag,
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


module.exports = {getPostsByCategory, getPost};