const { mergeSteemCommentsWithDB } = require('utilities/helpers/commentHelper');
const { mergePostData } = require('utilities/helpers/postHelper');
const { hiddenCommentModel, mutedUserModel } = require('models');
const { postsUtil, hiveClient } = require('utilities/hiveApi');
const _ = require('lodash');

module.exports = async ({
  author, permlink, category, userName, app,
}) => {
  const { result: postState, error } = await hiveClient.execute(
    postsUtil.getPostState,
    { author, permlink, category },
  );

  if (error) return { error };
  const comments = await mergeComments(postState);
  const moderators = _.get(app, 'moderators', []);
  const { hiddenComments } = await hiddenCommentModel.getHiddenComments(userName, ...moderators);

  const { result: mutedUsers } = await mutedUserModel.find({
    condition: { $or: [{ mutedBy: userName }, { mutedForApps: _.get(app, 'host') }] },
  });
  const result = _
    .chain(comments)
    .differenceWith(hiddenComments, (a, b) => a.author === b.author && a.permlink === b.permlink)
    .filter((comment) => !_.includes(_.map(mutedUsers, 'userName'), comment.author))
    .value();

  postState.content = _.keyBy(result, (c) => `${c.author}/${c.permlink}`);
  postState.content[`${author}/${permlink}`] = await mergePostData(postState.content[`${author}/${permlink}`]);
  return { result: postState };
};

const mergeComments = async (postState) => {
  const steemComments = _.chain(postState).get('content', []).values().value();

  return mergeSteemCommentsWithDB({ steemComments });
};
