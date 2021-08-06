const { postsUtil, userUtil } = require('utilities/hiveApi');
const { redisGetter } = require('utilities/redis');
const { Post } = require('models');
const _ = require('lodash');

module.exports = async ({
  userName, weight, author, permlink,
}) => {
  const priceInfo = await redisGetter.importUserClientHGetAll('current_price_info');
  const { userData: account } = await userUtil.getAccount(userName);

  if (!account) return 0;

  const vests = parseFloat(account.vesting_shares)
    + parseFloat(account.received_vesting_shares)
    - parseFloat(account.delegated_vesting_shares);

  const previousVoteTime = (new Date().getTime() - new Date(`${account.last_vote_time}Z`).getTime()) / 1000;
  const accountVotingPower = Math.min(
    10000,
    account.voting_power + (10000 * previousVoteTime) / 432000,
  );

  const power = Math.round(((accountVotingPower / 100) * weight) / 50);
  const rShares = vests * power * 100 - 50000000;

  const postVoteRhares = await getPostVoteRhares({ author, permlink });

  const tRShares = postVoteRhares + rShares;

  const rewards = parseFloat(priceInfo.reward_balance) / parseFloat(priceInfo.recent_claims);
  const postValue = tRShares * rewards * parseFloat(priceInfo.price);
  const voteValue = postValue * (rShares / tRShares);

  return voteValue >= 0 ? voteValue : 0;
};

const getPostVoteRhares = async ({ author, permlink }) => {
  let { result: [post] } = await Post.findByBothAuthors({ author, permlink });
  if (!post) {
    ({ post } = await postsUtil.getPost({ author, permlink }));
  }
  return _.get(post, 'vote_rshares')
    ? parseFloat(post.vote_rshares)
    : 0;
};
