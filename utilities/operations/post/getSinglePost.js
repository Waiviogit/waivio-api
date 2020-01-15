const { postsUtil } = require( '../../steemApi' );
const { Post } = require( '../../../models' );
const { getPostObjects, mergePostData } = require( '../../helpers/postHelper' );
const _ = require( 'lodash' );
/**
 * Return single post of steem blockchain (if it exist).
 * Return merged data of "steem" post with post from Mongo DB, merging augment keys and likes from "active_votes"
 * Post wrote by guest user through proxy-bot can be returned with "guest" user as author and with "proxy-bot" as author,
 * related with which author post was requested(guest or proxy-bot)
 * @param author
 * @param permlink
 * @returns {Promise<{post: Object}|{error: Object}>}
 */
module.exports = async ( author, permlink ) => {
    let post;
    // get post with specified author(ordinary post)
    const { post: dbPost, error: dbError } = await Post.getOne( { author, permlink } );
    if( dbError ) return { error: dbError };
    if( dbPost ) {
        post = dbPost;
    } else {
        // if post above not found, there is can be guest post with root_author/permlink of requested author/permlink
        const { post: guestPost, error: guestPostError } = await Post.getOne( { root_author: author, permlink } );
        if( guestPostError ) return { error: guestPostError };
        if( guestPost ) post = guestPost;
    }

    let { post: steemPost, error: steemError } = await postsUtil
        .getPost( post ? post.root_author || post.author : author, permlink );
    if( !steemPost || steemError ) {
        return { error: steemError };
    }
    let resultPost = steemPost;
    const wobjsResult = await getPostObjects( author, permlink );
    resultPost.wobjects = _.get( wobjsResult, 'wobjectPercents', [] );
    resultPost.fullObjects = _.get( wobjsResult, 'wObjectsData', [] );
    resultPost = await mergePostData( resultPost, post );

    // if post requested with guest name as author -> return post with guest name as author
    resultPost.author = author;

    return { post: resultPost };
};
