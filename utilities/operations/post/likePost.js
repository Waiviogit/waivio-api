const _ = require('lodash');
const { Post } = require('models');
const updatePost = require('utilities/operations/post/updatePost');

module.exports = async (value) => {
  const voteInfo = _.get(value, 'operations[1]');

  const { hive, waiv, getPost } = await updatePost(voteInfo);

  const { rShares, postValue, rewards } = hive;

  const { rshares } = waiv;

  const { post, error } = getPost;

  if (!post || error) return { error };

  const updateData = {};

  const voteInPost = _.find(post.active_votes, (v) => v.voter === voteInfo.voter);
  voteInPost
    ? Object.assign(
      post.active_votes[post.active_votes.indexOf(voteInPost)],
      { rshares: Math.round(rShares), weight: Math.round(rShares * 1e-6) },
    )
    : post.active_votes.push({
      voter: voteInfo.voter,
      percent: voteInfo.weight,
      rshares: Math.round(rShares),
      weight: Math.round(rShares * 1e-6),
    });
  updateData.net_rshares = post.net_rshares + rShares;

  updateData.updatePost = true;

  updateData.net_rshares_WAIV = post.net_rshares_WAIV ? (post.net_rshares_WAIV + rshares) : rshares;

  updateData.pending_payout_value = postValue < 0 ? '0.000 HBD' : `${postValue.toFixed(3)} HBD`;

  updateData.total_payout_WAIV = updateData.net_rshares_WAIV * rewards;

  updateData.active_votes = post.active_votes;

  const { result, error: updateError } = await Post.findForUpdate({ author: voteInfo.author, permlink: voteInfo.permlink, updateData });

  if (!result || updateError) return { updateError };
  return { post: result };
};
