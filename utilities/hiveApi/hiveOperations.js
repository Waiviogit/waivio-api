const userUtil = require('utilities/hiveApi/userUtil');
const postsUtil = require('utilities/hiveApi/postsUtil');
const { redisGetter } = require('utilities/redis');
const { Post } = require('models');
const _ = require('lodash');

exports.calcHiveVote = async ({
  userName, weight, author, permlink,
}) => {
  const {
    account, rewardBalance, recentClaims, price,
  } = await getAccountAndCurrentPrice({ userName });

  if (!account) return { hiveVotePrice: 0 };

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

  const rewards = rewardBalance / recentClaims;
  const postValue = tRShares * rewards * price;
  const voteValue = postValue * (rShares / tRShares);

  const hiveVotePrice = voteValue >= 0 ? voteValue : 0;
  return { hiveVotePrice };
};

// estimated maximum value
exports.calcHiveVoteValue = async ({
  userName,
}) => {
  const {
    account, rewardBalance, recentClaims, price,
  } = await getAccountAndCurrentPrice({ userName });
  if (!account) return { estimatedHIVE: 0 };

  const vests = parseFloat(account.vesting_shares)
    + parseFloat(account.received_vesting_shares)
    - parseFloat(account.delegated_vesting_shares);

  const secondsAgo = (new Date().getTime() - new Date(`${account.last_vote_time}Z`).getTime()) / 1000;
  const accountVotingPower = Math.min(10000, account.voting_power + (10000 * secondsAgo) / 432000);

  const power = Math.round((accountVotingPower + 49) / 50);
  const rshares = vests * power * 100 - 50000000;
  const rewards = rewardBalance / recentClaims;

  const estimate = rshares * rewards * price;
  return { estimatedHIVE: estimate < 0 ? 0 : estimate };
};

const getAccountAndCurrentPrice = async ({ userName }) => {
  // eslint-disable-next-line camelcase
  const { reward_balance, recent_claims, price } = await redisGetter
    .importUserClientHGetAll('current_price_info');
  const { userData: account } = await userUtil.getAccount(userName);
  return {
    account,
    rewardBalance: parseFloat(reward_balance),
    recentClaims: parseFloat(recent_claims),
    price: parseFloat(price),
  };
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
