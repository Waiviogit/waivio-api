const _ = require('lodash');
const { mergeSteemCommentsWithDB, mergeDbCommentsWithSteem } = require('../../helpers/commentHelper');
const { postsUtil } = require('../../hiveApi');
const { Comment, User, mutedUserModel } = require('../../../models');
const engineOperations = require('../../hiveEngine/engineOperations');

module.exports = async ({
  // eslint-disable-next-line camelcase
  name, start_permlink, limit, skip, app, userName,
}) => {
  const { result: mutedUsers } = await mutedUserModel.find({
    condition: { $or: [{ userName: name, mutedForApps: _.get(app, 'host') }, { userName: name, mutedBy: userName }] },
  });
  if (!_.isEmpty(mutedUsers)) return { comments: [] };

  if (await isGuestUser(name)) {
    return getGuestComments({ name, skip, limit });
  }
  return getSteemUserComments({ start_author: name, start_permlink, limit });
};

const getGuestComments = async ({ name, skip, limit }) => {
  const { comments: dbComments, error: dbError } = await Comment.getMany({ cond: { 'guestInfo.userId': name }, skip, limit });

  if (dbError) return { error: dbError };
  const mergedComments = await mergeDbCommentsWithSteem({ dbComments });

  await engineOperations.addWAIVToCommentsArray(mergedComments);

  return { comments: mergedComments };
};

// eslint-disable-next-line camelcase
const getSteemUserComments = async ({ start_author, start_permlink, limit }) => {
  const comments = [];
  let currentStartPermlink = start_permlink;

  while (comments.length < limit) {
    // eslint-disable-next-line camelcase
    const cond = currentStartPermlink
      ? { start_author, start_permlink: currentStartPermlink, limit: limit + 1 }
      : { start_author, limit };

    const { comments: steemComments, error } = await postsUtil.getUserComments(cond);
    if (!steemComments?.length || error) break;
    currentStartPermlink = steemComments[steemComments.length - 1].permlink;
    const commentsToProcess = steemComments.slice(start_permlink ? 1 : 0);
    const filteredComments = commentsToProcess
      .filter((comment) => comment.parent_author !== 'leothreads'
        && !comment.url.includes('leothreads'));
    if (filteredComments.length === 0) continue;
    const remainingSlots = limit - comments.length;
    comments.push(...filteredComments.slice(0, remainingSlots));
    if (comments.length >= limit) break;
  }

  if (comments.length === 0) return { comments: [] };

  const mergedComments = await mergeSteemCommentsWithDB({
    steemComments: comments,
  });
  await engineOperations.addWAIVToCommentsArray(mergedComments);

  return { comments: mergedComments };
};

/**
 * Check for guest user
 * @param name {String} name of user
 * @returns {Promise<boolean>} Return true if user exist and it's guest user, else false
 */
const isGuestUser = async (name) => {
  const { user } = await User.getOne(name);

  return user && user.auth && user.auth.provider;
};
