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


module.exports = {getPostsByTrending, getPostsByFeed};