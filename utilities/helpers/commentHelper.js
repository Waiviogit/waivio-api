const _ = require('lodash');
const { Comment } = require('models');
const { postsUtil } = require('utilities/steemApi');

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
  const resComments = steemComments.map((stComment) => {
    const dbComm = _.find(dbComments, { ..._.pick(stComment, ['author', 'permlink']) });

    if (dbComm) {
      stComment.active_votes.push(...dbComm.active_votes);
      stComment.guestInfo = dbComm.guestInfo;
    }
    return stComment;
  });

  return resComments;
};

/**
 * Merge data between array of dbComments and steemComments
 * dbComments as source array, steemComments not required
 * @param steemComments {Array} array of steem comments (not required).
 * @param dbComments {Array} array of db comments(required). Used as a source array
 * @returns {Promise<Array>} return array of db comments with all steem comment info
 */
exports.mergeDbCommentsWithSteem = async ({ dbComments, steemComments }) => {
  if (!steemComments || _.isEmpty(steemComments)) {
    const { posts: stComments } = await postsUtil.getManyPosts(
      dbComments.map((c) => ({ ..._.pick(c, ['author', 'permlink']) })),
    );

    steemComments = stComments;
  }
  const resComments = dbComments.map((dbComment) => {
    const steemComment = _.find(steemComments, { ..._.pick(dbComment, ['author', 'permlink']) });

    if (steemComment) {
      steemComment.active_votes.push(...dbComment.active_votes);
      steemComment.guestInfo = dbComment.guestInfo;
      return steemComment;
    }
    return dbComment;
  });

  return resComments;
};
