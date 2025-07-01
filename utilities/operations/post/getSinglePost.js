const _ = require('lodash');
const {
  Post, Comment, App, hiddenPostModel, mutedUserModel,
} = require('../../../models');
const { getPostObjects } = require('../../helpers/postHelper');
const { checkBlackListedComment } = require('../../helpers/commentHelper');
const engineOperations = require('../../hiveEngine/engineOperations');
const { postsUtil } = require('../../hiveApi');
const asyncLocalStorage = require('../../../middlewares/context/context');
const config = require('../../../config');

/**
 * Return single post/comment of steem blockchain (if it exist).
 * Return merged data of "steem" post/comment with post/comment from Mongo DB,
 * merging augment keys and likes from "active_votes"
 * Post/comment wrote by guest user through proxy-bot can be
 * returned with "guest" user as author and with "proxy-bot" as author,
 * related with which author post/comment was requested(guest or proxy-bot)
 * @param author
 * @param permlink
 * @param userName
 * @returns {Promise<{post: Object}|{error: Object}>}
 */
module.exports = async ({ author, permlink, userName }) => {
  const { hiddenPosts = [] } = await hiddenPostModel.getHiddenPosts(userName);

  const { result: muted = [] } = await mutedUserModel.find({
    condition: {
      $or: [
        { mutedBy: userName },
        { mutedForApps: config.appHost },
      ],
    },
  });

  const store = asyncLocalStorage.getStore();
  const host = store.get('host');
  const { result: app } = await App.findOne({ host });
  const { error, post: postResult } = await getPost({
    author, permlink, host, hiddenPosts, muted: _.map(muted, 'userName'),
  });

  if (error) return { error };
  if (postResult) return { post: postResult };

  const {
    error: commentError,
    comment: commentResult,
  } = await getComment({ author, permlink, app });

  if (commentError) return { error: commentError };
  await engineOperations.addWAIVToSingleComment(commentResult);
  return { post: commentResult };
};

const getPost = async ({
  author, permlink, host, hiddenPosts, muted,
}) => {
  if (_.includes(muted, author)) {
    return { error: { status: 404, message: 'Post not found!' } };
  }

  // get post with specified author(ordinary post)
  const { result: dbPosts, error: dbError } = await Post.findByBothAuthors({ author, permlink });

  if (dbError) return { error: dbError };

  const post = _.get(dbPosts, '[0]');
  if (!post) return { post: null };
  /** Not return post which was downvoted by moderator */
  if (_.includes(_.get(post, 'blocked_for_apps', []), host)) {
    return { error: { status: 404, message: 'Post not found!' } };
  }
  if (_.includes(hiddenPosts, _.get(post, '_id', '').toString())) {
    return { error: { status: 404, message: 'Post not found!' } };
  }

  const wobjsResult = await getPostObjects(_.get(post, 'wobjects'));
  post.wobjects = _.get(wobjsResult, 'wobjectPercents', []);
  post.fullObjects = _.get(wobjsResult, 'wObjectsData', []);

  return { post };
};

const getComment = async ({ author, permlink, app }) => {
  const { result, error } = await Comment.findByCond({
    $or: [{ author, permlink }, { 'guestInfo.userId': author, permlink }],
  });

  if (error) return { error: error || 'Comment not found!' };

  // if comment not found in DB, it still might exist in STEEM
  if (!_.get(result, '[0]')) {
    const { post: comment, error: steemError } = await postsUtil.getPost(
      { author, permlink },
    );
    if (steemError) return { error: steemError };
    if (await checkBlackListedComment({ app, votes: comment.active_votes })) {
      return { error: { status: 404, message: 'Post not found!' } };
    }

    return { comment };
  }
  return mergeCommentData(result[0], app);
};

const mergeCommentData = async (comment, app) => {
  const { post: steemComment, error } = await postsUtil.getPost(
    { author: comment.author, permlink: comment.permlink },
  );
  if (error) return { error };

  // add guest votes to comment votes (if they exists)
  steemComment.active_votes.push(...comment.active_votes);
  // Check for moderator downvote
  if (await checkBlackListedComment({ app, votes: steemComment.active_votes })) {
    return { error: { status: 404, message: 'Post not found!' } };
  }

  return { comment: { ...steemComment, guestInfo: comment.guestInfo } };
};
