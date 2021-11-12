const { Post } = require('models');
const hiveOperations = require('utilities/hiveApi/hiveOperations');
const engineOperations = require('utilities/hiveEngine/engineOperations');
const { TOKEN_WAIV } = require('constants/hiveEngine');
const _ = require('lodash');

module.exports = async (value) => {
  const voteInfo = _.get(value, 'operations[1]');

  const {
    rShares, postValue, rewards,
  } = await hiveOperations.calcHiveVote({
    userName: voteInfo.voter, weight: voteInfo.weight, author: voteInfo.author, permlink: voteInfo.permlink,
  });

  const { rshares } = await engineOperations.calculateHiveEngineVote({
    symbol: TOKEN_WAIV.SYMBOL, account: voteInfo.voter, poolId: TOKEN_WAIV.POOL_ID, weight: voteInfo.weight, dieselPoolId: TOKEN_WAIV.DIESEL_POOL_ID,
  });

  const { post } = await Post.findOneByBothAuthors({ author: voteInfo.author, permlink: voteInfo.permlink });
  // console.log(post);
  if (_.isEmpty(post)) {
    return { error: { status: 404, message: 'Posts not found!' } };
  }

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

  updateData.net_rshares_WAIV = post.net_rshares_WAIV ? (post.net_rshares_WAIV + rshares) : rshares;

  updateData.pending_payout_value = postValue < 0 ? '0.000 HBD' : `${postValue.toFixed(3)} HBD`;

  updateData.total_payout_WAIV = updateData.net_rshares_WAIV * rewards;

  updateData.active_votes = post.active_votes;

  const { result, error } = await Post.findForUpdate({ author: voteInfo.author, permlink: voteInfo.permlink, updateData });

  if (!result) return { error };
  return { posts: result };
};
