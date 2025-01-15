const { mergeSteemCommentsWithDB } = require('utilities/helpers/commentHelper');
const { mergePostData } = require('utilities/helpers/postHelper');
const engineOperations = require('utilities/hiveEngine/engineOperations');
const { hiddenCommentModel, mutedUserModel } = require('models');
const { postsUtil } = require('utilities/hiveApi');
const _ = require('lodash');
const config = require('config');

module.exports = async ({
  author, permlink, category, userName, app,
}) => {
  const { result: postState, error } = await postsUtil.getPostState(
    { author, permlink, category },
  );

  if (error) return { error };
  const comments = await mergeComments(postState);

  const filteredComments = await filterMutedUsers({
    comments, userName, author, app,
  });

  postState.content = _.keyBy(filteredComments, (c) => `${c.author}/${c.permlink}`);
  await engineOperations.addWAIVToCommentsObject(postState.content);

  postState.content[`${author}/${permlink}`] = await mergePostData(postState.content[`${author}/${permlink}`]);
  return { result: postState };
};

const mergeComments = async (postState) => {
  const steemComments = _.chain(postState).get('content', []).values().value();

  return mergeSteemCommentsWithDB({ steemComments });
};

const filterMutedUsers = async ({
  comments, userName, author, app,
}) => {
  const appHost = _.get(app, 'host', config.appHost);

  const { hiddenComments } = await hiddenCommentModel
    .getHiddenComments(userName, ..._.get(app, 'moderators', []));
  const { result: mutedUsers } = await mutedUserModel.find({
    condition: {
      $or: [
        { mutedBy: { $in: [userName, author, ..._.map(comments, 'author')] } },
        { mutedForApps: appHost },
      ],
    },
  });
  const { mainMuted, subMuted } = _.reduce(mutedUsers, (acc, el) => {
    (_.includes([userName, author], el.mutedBy) || _.includes(el.mutedForApps, appHost))
      ? acc.mainMuted.push(el)
      : acc.subMuted.push(el);
    return acc;
  }, { mainMuted: [], subMuted: [] });

  return _
    .chain(comments)
    .differenceWith(hiddenComments, (a, b) => a.author === b.author && a.permlink === b.permlink)
    .reject((comment) => {
      const condition = _.includes(_.map(mainMuted, 'userName'), comment.author);
      const condition2 = _.find(
        subMuted,
        (sb) => sb.mutedBy === comment.parent_author && sb.userName === comment.author,
      );
      const conditionGuest = _.includes(_.map(mainMuted, 'userName'), _.get(comment, 'guestInfo.userId'));
      if (condition || condition2 || conditionGuest) {
        removeRepliesFromComment({ comments, comment });
      }
      return condition || condition2 || conditionGuest;
    })
    .value();
};

const removeRepliesFromComment = ({ comments, comment }) => {
  const parentComment = _.find(
    comments,
    (root) => root.author === comment.parent_author && root.permlink === comment.parent_permlink,
  );
  if (!parentComment) return;
  parentComment.replies = _.filter(
    parentComment.replies,
    (permlink) => permlink !== `${comment.author}/${comment.permlink}`,
  );
};
