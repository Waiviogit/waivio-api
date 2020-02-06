const _ = require('lodash');
const { postsUtil } = require('utilities/steemApi');
const { mergeSteemCommentsWithDB } = require('utilities/helpers/commentHelper');
const { mergePostData } = require('utilities/helpers/postHelper');

module.exports = async ({ author, permlink, category }) => {
  const { result: postState, error } = await postsUtil.getPostState({ author, permlink, category });

  if (error) return { error };
  const comments = await mergeComments(postState);

  postState.content = _.keyBy(comments, (c) => `${c.author}/${c.permlink}`);
  postState.content[`${author}/${permlink}`] = await mergePostData(postState.content[`${author}/${permlink}`]);
  return { result: postState };
};

const mergeComments = async (postState) => {
  const steemComments = _.chain(postState).get('content', []).values().value();

  return mergeSteemCommentsWithDB({ steemComments });
};
