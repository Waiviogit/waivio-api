const _ = require('lodash');
const userUtil = require('./userUtil');
const postsUtil = require('./postsUtil');
const { redisGetter } = require('../redis');
const { CACHE_KEY } = require('../../constants/common');
const { Post } = require('../../models');

exports.calcHiveVote = async ({
  userName, weight, author, permlink,
}) => {
  const {
    account, rewardBalance, recentClaims, price,
  } = await getAccountAndCurrentPrice({ userName });
  const rewards = rewardBalance / recentClaims;

  if (!account) {
    return {
      hiveVotePrice: 0,
      rShares: 0,
      rewards,
      price,
    };
  }

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

  const postVoteRhares = await getPostNetRshares({ author, permlink });

  const tRShares = postVoteRhares + rShares;

  const postValue = tRShares * rewards * price;
  const voteValue = postValue * (rShares / tRShares);

  const hiveVotePrice = voteValue >= 0 ? voteValue : 0;

  return {
    hiveVotePrice, rShares, rewards, price,
  };
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
    .importUserClientHGetAll(CACHE_KEY.CURRENT_PRICE_INFO);
  const { userData: account } = await userUtil.getAccount(userName);
  return {
    account,
    rewardBalance: parseFloat(reward_balance),
    recentClaims: parseFloat(recent_claims),
    price: parseFloat(price),
  };
};

const getPostNetRshares = async ({ author, permlink }) => {
  let { result: [post] } = await Post.findByBothAuthors({ author, permlink });
  if (!post) {
    ({ post } = await postsUtil.getPost({ author, permlink }));
  }
  return _.get(post, 'net_rshares')
    ? parseFloat(post.net_rshares)
    : 0;
};
