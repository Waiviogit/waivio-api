const _ = require('lodash');
const { postsUtil } = require('utilities/steemApi');
const { mergeSteemCommentsWithDB } = require('utilities/helpers/commentHelper');
const { mergePostData } = require('utilities/helpers/postHelper');
const { getApp } = require('utilities/helpers/appHelper');
const { hiddenCommentModel } = require('models');

module.exports = async ({
  author, permlink, category, userName,
}) => {
  const { result: postState, error } = await postsUtil.getPostState({ author, permlink, category });

  if (error) return { error };
  const comments = await mergeComments(postState);
  const { adminsArray } = await getModerators();
  const { hiddenComments } = await hiddenCommentModel.getHiddenComments(userName, ...adminsArray);

  const result = _.filter(
    comments,
    (el) => !_.some(hiddenComments, (i) => i.author === el.author && i.permlink === el.permlink),
  );

  postState.content = _.keyBy(result, (c) => `${c.author}/${c.permlink}`);
  postState.content[`${author}/${permlink}`] = await mergePostData(postState.content[`${author}/${permlink}`]);
  return { result: postState };
};

const mergeComments = async (postState) => {
  const steemComments = _.chain(postState).get('content', []).values().value();

  return mergeSteemCommentsWithDB({ steemComments });
};

const getModerators = async () => {
  const { result } = await getApp();
  const adminsArray = _.concat(_.get(result, 'admins'), _.get(result, 'moderators'));
  return { adminsArray };
};
