const _ = require('lodash');
const { getPostObjects, mergePostData } = require('utilities/helpers/postHelper');
const { Post, Comment } = require('models');
const { postsUtil } = require('utilities/steemApi');
/**
 * Return single post/comment of steem blockchain (if it exist).
 * Return merged data of "steem" post/comment with post/comment from Mongo DB,
 * merging augment keys and likes from "active_votes"
 * Post/comment wrote by guest user through proxy-bot can be
 * returned with "guest" user as author and with "proxy-bot" as author,
 * related with which author post/comment was requested(guest or proxy-bot)
 * @param author
 * @param permlink
 * @returns {Promise<{post: Object}|{error: Object}>}
 */

module.exports = async (author, permlink) => {
  const postResult = await getPost({ author, permlink });

  if (_.get(postResult, 'error')) return { error: postResult.error };
  if (_.get(postResult, 'post')) return { post: postResult.post };

  const commentResult = await getComment({ author, permlink });

  if (_.get(commentResult, 'error')) return { error: commentResult.error };
  if (_.get(commentResult, 'comment')) return { post: commentResult.comment };
};

const getPost = async ({ author, permlink }) => {
  // get post with specified author(ordinary post)
  const { result: dbPosts, error: dbError } = await Post.findByBothAuthors({ author, permlink });

  if (dbError) return { error: dbError };

  const post = _.get(dbPosts, '[0]');

  const { post: steemPost } = await postsUtil
    .getPost(post ? post.root_author || post.author : author, permlink);

  if (!steemPost || steemPost.parent_author) return;
  // if( steemError ) return { error: steemError };

  let resultPost = steemPost;
  const wobjsResult = await getPostObjects(author, permlink);

  resultPost.wobjects = _.get(wobjsResult, 'wobjectPercents', []);
  resultPost.fullObjects = _.get(wobjsResult, 'wObjectsData', []);

  resultPost = await mergePostData(resultPost, post);

  // if post requested with guest name as author -> return post with guest name as author
  resultPost.author = author;

  return { post: resultPost };
};

const getComment = async ({ author, permlink }) => {
  const { result, error } = await Comment.findByCond({
    $or: [{ author, permlink }, { 'guestInfo.userId': author, permlink }],
  });

  if (error) return { error: error || 'Comment not found!' };

  // if comment not found in DB, it still might exist in STEEM
  if (!_.get(result, '[0]')) {
    const { post: comment, error: steemError } = await postsUtil.getPost(author, permlink);

    return { comment, error: steemError };
  }
  return mergeCommentData(result[0]);
};

const mergeCommentData = async (comment) => {
  const { post: steemComment, error } = await postsUtil.getPost(comment.author, comment.permlink);

  if (error) return { error };
  // add guest votes to comment votes (if they exists)
  steemComment.active_votes.push(...comment.active_votes);
  return { comment: { ...steemComment, guestInfo: comment.guestInfo } };
};
