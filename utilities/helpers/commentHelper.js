const { postsUtil } = require('utilities/hiveApi');
const { Comment, User, App } = require('models');
const _ = require('lodash');
const asyncLocalStorage = require('../../middlewares/context/context');

/**
 * Merge data between array of steemComments and dbComments
 * steemComments as source array, dbComments not required
 * @param steemComments {Array} array of steem comments (required). Used as a source array
 * @param dbComments {Array} array of db comments(not required).
 * @returns {Promise<Array>} return array of steem comments with some DB data
 */
exports.mergeSteemCommentsWithDB = async ({ steemComments, dbComments }) => {
  if (!dbComments || _.isEmpty(dbComments)) {
    const cond = {
      $or: [
        ...steemComments.map((c) => ({ ..._.pick(c, ['author', 'permlink']) })),
      ],
    };
    const { result: dbComm } = await Comment.findByCond(cond);

    dbComments = dbComm;
  }
  let resComments = steemComments.map((stComment) => {
    const dbComm = _.find(dbComments, { ..._.pick(stComment, ['author', 'permlink']) });

    if (dbComm) {
      stComment.active_votes.push(...dbComm.active_votes);
      stComment.guestInfo = dbComm.guestInfo;
    }
    return stComment;
  });
  const authors = _.map(
    resComments,
    (comment) => (comment.guestInfo ? comment.guestInfo.userId : comment.author),
  );
  const { usersData } = await User.find({ condition: { name: { $in: authors } } });
  resComments = _.forEach(resComments, (comment) => {
    const authorName = comment.guestInfo ? comment.guestInfo.userId : comment.author;
    const userInfo = _.find(usersData, (user) => user.name === authorName);
    comment.author_reputation = _.get(userInfo, 'wobjects_weight', 0);
  });
  /** Check for moderator downvote */
  const filteredComments = [];
  const store = asyncLocalStorage.getStore();
  const host = store.get('host');
  const { result: app } = await App.findOne({ host });
  for (const comment of resComments) {
    if (!await this.checkBlackListedComment({ app, votes: comment.active_votes })) {
      filteredComments.push(comment);
    }
  }
  return filteredComments;
};

/**
 * Merge data between array of dbComments and steemComments
 * dbComments as source array, steemComments not required
 * @param steemComments {Array} array of steem comments (not required).
 * @param dbComments {Array} array of db comments(required). Used as a source array
 * @returns {Promise<Array>} return array of db comments with all steem comment info
 */
exports.mergeDbCommentsWithSteem = async ({ dbComments, steemComments }) => {
  const store = asyncLocalStorage.getStore();
  const host = store.get('host');
  const { result: app } = await App.findOne({ host });

  if (!steemComments || _.isEmpty(steemComments)) {
    const { posts: stComments } = await postsUtil.getManyPosts(
      dbComments.map((c) => ({ ..._.pick(c, ['author', 'permlink']) })),
    );

    steemComments = stComments;
  }
  return Promise.all(dbComments.map(async (dbComment) => {
    const steemComment = _.find(steemComments, { ..._.pick(dbComment, ['author', 'permlink']) });

    if (steemComment) {
      steemComment.active_votes.push(...dbComment.active_votes);
      steemComment.guestInfo = dbComment.guestInfo;
      if (!await this.checkBlackListedComment({ app, votes: steemComment.active_votes })) {
        return steemComment;
      }
    }
    if (!await this.checkBlackListedComment({ app, votes: dbComment.active_votes })) {
      return dbComment;
    }
  }));
};

/** Check for moderators downvote */
exports.checkBlackListedComment = async ({ app, votes }) => {
  const downVoteNames = _.map(votes, (vote) => {
    if (+vote.percent < 0) return vote.voter;
  }) || [];
  return !!_.intersection(_.get(app, 'moderators', []), downVoteNames).length;
};
