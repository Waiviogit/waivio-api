const Wobj = require('../../models/wObjectModel');
const {postsUtil} = require('../steemApi');
const {redisGetter} = require('../redis');
const _ = require('lodash');

const getPostObjects = async function (author = '', permlink = '') {
    const redisResult = await redisGetter.getWobjRefs(`${author}_${permlink}`);
    if (!redisResult) {
        return
    } else if (redisResult.wobjects) {
        let wobjs;      //list of wobjects on post with percents
        try {
            wobjs = JSON.parse(redisResult.wobjects)
        } catch (e) {
            console.log(e);
        }
        if (Array.isArray(wobjs) && !_.isEmpty(wobjs)) {
            const {wObjectsData, error} = await Wobj.getAll({
                author_permlinks: wobjs.map(w => w.author_permlink),
                skip: 0,
                limit: 100,
                user_limit: 0,
                locale: 'en-US'
            });
            wObjectsData.forEach(w => {
                w = Object.assign(w, wobjs.find(wobj => wobj.author_permlink === w.author_permlink));
            });
            return wObjectsData;
        }
    }
};

const getPost = async function (author, permlink) {
    const {post, error} = await postsUtil.getPost(author, permlink);
    if (!post || error)
        return {error};
    const postWobjects = await getPostObjects(author, permlink);
    if (Array.isArray(postWobjects) && !_.isEmpty(postWobjects)) {
        post.wobjects = postWobjects;
    }
    return {post};
};

const getPostsByCategory = async function (data) {
    const {posts, error} = await postsUtil.getPostsByCategory(data);
    if (error) {
        return {error}
    }
    if (!posts || posts.error)
        return {error:{status: 404, message:posts.error.message}};
    for (const post of posts) {
        let postWobjects;
        if (post && post.author && post.permlink)
            postWobjects = await getPostObjects(post.author, post.permlink);
        if (Array.isArray(postWobjects) && !_.isEmpty(postWobjects)) {
            post.wobjects = postWobjects;
        }
    }
    return {posts}
};

module.exports = {getPostObjects, getPost, getPostsByCategory}