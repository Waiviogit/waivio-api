const {postsUtil} = require('../steemApi');
const {User} = require('../../database').models;
const Post = require('../../models/PostModel');
const {getPostObjects} = require('./postHelper');
const _ = require('lodash');

const getCombinedFeed = async function ({user, limit, count_with_wobj, start_author, start_permlink}) {
    const from_wobj_follow = await feedByObjects({user, limit, skip: count_with_wobj}); //posts from db
    if (!from_wobj_follow || from_wobj_follow.error)
        return {error: from_wobj_follow.error};
    let from_user_follow = await postsUtil.getPostsByCategory({
        category: 'feed',
        tag: user,
        limit: limit + 1,
        start_author: start_author,
        start_permlink: start_permlink
    });                                                                                 //posts from blockchain
    from_user_follow.posts = from_user_follow.posts.slice(1);
    for (const post of from_user_follow.posts) {          //for each post from user following add wobjects if it exist
        const postWobjects = await getPostObjects(post.author, post.permlink);
        if (postWobjects)
            from_user_follow.post.wobjects = postWobjects; //??????????? post.wobjects = postWobjects;
    }
    if (!from_user_follow || from_user_follow.error)
        return {error: from_user_follow.error};
    let combined_feed = _.uniqWith([...from_user_follow.posts, ...from_wobj_follow.posts],
        (x, y) => x.author === y.author && x.permlink === y.permlink);
    combined_feed = _.orderBy(combined_feed, ['created'], ['desc']);
    combined_feed = combined_feed.slice(0, limit);

    let tempCombFeed = _.orderBy([...from_wobj_follow.posts, ...from_user_follow.posts], ['created'], ['desc']);
    tempCombFeed = tempCombFeed.slice(0, _.findLastIndex(tempCombFeed, {
        'author': _.last(combined_feed).author,
        'permlink': _.last(combined_feed).permlink
    }) + 1);

    count_with_wobj += _.countBy(tempCombFeed, (post) => !!post._id).true || 0;
    const last_from_user_follow = _.findLast(tempCombFeed, (p) => !!p.post_id);
    if (last_from_user_follow) {
        start_author = last_from_user_follow.author;
        start_permlink = last_from_user_follow.permlink;
    }
    return {result: {posts: combined_feed, count_with_wobj, start_permlink, start_author}}
};

/**
 * @param data include user, limit, skip
 * @returns {Promise<void>} return array of posts
 */
const feedByObjects = async function (data) {
    const user = await User.findOne({name: data.user}).lean();      //get user data from db
    if (!user) {
        return [];
    }
    data.objects = user.objects_follow;


    const {posts, error} = await Post.getFeedByObjects(data);
    if (error) {
        return {error}
    }
    return {posts}
};

module.exports = {getCombinedFeed, feedByObjects};