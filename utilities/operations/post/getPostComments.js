const { mergeSteemCommentsWithDB } = require('utilities/helpers/commentHelper');
const { mergePostData } = require('utilities/helpers/postHelper');
const { hiddenCommentModel, mutedUserModel } = require('models');
const { postsUtil } = require('utilities/hiveApi');
const _ = require('lodash');

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
  const { hiddenComments } = await hiddenCommentModel
    .getHiddenComments(userName, ..._.get(app, 'moderators', []));
  const { result: mutedUsers } = await mutedUserModel.find({
    condition: {
      $or: [
        { mutedBy: { $in: [userName, author, ..._.map(comments, 'author')] } },
        { mutedForApps: _.get(app, 'host') },
      ],
    },
  });

  const { mainMuted, subMuted } = _.reduce(mutedUsers, (acc, el) => {
    _.includes([userName, author], el.mutedBy)
      ? acc.mainMuted.push(el)
      : acc.subMuted.push(el);
    return acc;
  }, { mainMuted: [], subMuted: [] });

  return _
    .chain(comments)
    .differenceWith(hiddenComments, (a, b) => a.author === b.author && a.permlink === b.permlink)
    .filter((comment) => (!_.includes(_.map(mainMuted, 'userName'), comment.author)))
    .filter((comment) => (
      !_.find(subMuted,
        (sb) => sb.mutedBy === comment.parent_author && sb.userName === comment.author)))
    .value();
};
