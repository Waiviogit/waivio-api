const _ = require('lodash');
const BigNumber = require('bignumber.js');
const { redisGetter } = require('../redis');
const { CACHE_KEY } = require('../../constants/common');
const { captureException } = require('../helpers/sentryHelper');
const commentContract = require('./commentContract');
const tokensContract = require('./tokensContract');
const marketPools = require('./marketPools');
const {
  VOTE_REGENERATION_DAYS,
  MAX_VOTING_POWER,
  DOWNVOTE_REGENERATION_DAYS,
  TOKEN_WAIV,
} = require('../../constants/hiveEngine');

exports.calculateMana = (
  votingPower = {
    votingPower: MAX_VOTING_POWER,
    downvotingPower: MAX_VOTING_POWER,
    lastVoteTimestamp: Date.now(),
  },
) => {
  const timestamp = new Date().getTime();
  const result = {
    votingPower: votingPower.votingPower,
    downvotingPower: votingPower.downvotingPower,
    lastVoteTimestamp: votingPower.lastVoteTimestamp,
  };

  result.votingPower += ((timestamp - result.lastVoteTimestamp) * MAX_VOTING_POWER)
    / (VOTE_REGENERATION_DAYS * 24 * 3600 * 1000);
  result.votingPower = Math.floor(result.votingPower);
  result.votingPower = Math.min(result.votingPower, MAX_VOTING_POWER);

  result.downvotingPower += ((timestamp - result.lastVoteTimestamp) * MAX_VOTING_POWER)
    / (DOWNVOTE_REGENERATION_DAYS * 24 * 3600 * 1000);
  result.downvotingPower = Math.floor(result.downvotingPower);
  result.downvotingPower = Math.min(result.downvotingPower, MAX_VOTING_POWER);
  return result;
};

exports.calculateHiveEngineVote = async ({
  symbol, account, poolId, weight, dieselPoolId,
}) => {
  const { rewardPool, pendingClaims } = await redisGetter
    .importUserClientHGetAll(`${CACHE_KEY.SMT_POOL}:${symbol}`);
  const rewards = parseFloat(rewardPool) / parseFloat(pendingClaims);

  const requests = await Promise.all([
    commentContract.getVotingPower({ query: { rewardPoolId: poolId, account } }),
    marketPools.getMarketPools({ query: { _id: dieselPoolId } }),
    tokensContract.getTokenBalances({ query: { symbol, account } }),
    redisGetter.importUserClientHGetAll(CACHE_KEY.CURRENT_PRICE_INFO),
  ]);

  for (const req of requests) {
    if (_.has(req, 'error') || _.isEmpty(req)) {
      if (_.has(req, 'error')) {
        await captureException(
          new Error(_.get(req, 'error.message', `calculateHiveEngineVote error ${account}`)),
        );
      }
      return { engineVotePrice: 0, rshares: 0, rewards };
    }
  }
  const [votingPowers, dieselPools, balances, hiveCurrency] = requests;
  const { stake, delegationsIn } = balances[0];
  const { votingPower } = this.calculateMana(votingPowers[0]);
  const { quotePrice } = dieselPools[0];

  const finalRshares = parseFloat(stake) + parseFloat(delegationsIn);
  const power = (votingPower * weight) / 10000;

  const rshares = (power * finalRshares) / 10000;
  // we calculate price in hbd cent for usd multiply quotePrice hiveCurrency.usdCurrency
  const price = parseFloat(quotePrice) * parseFloat(hiveCurrency.price);

  const engineVotePrice = rshares * price * rewards;
  return { engineVotePrice, rshares, rewards };
};

exports.addWAIVToCommentsArray = async (content) => {
  const reqData = _.map(content, (c) => `@${c.author}/${c.permlink}`);
  const commentsWithWaiv = await commentContract
    .getPosts({ query: { authorperm: { $in: reqData }, symbol: TOKEN_WAIV.SYMBOL, voteRshareSum: { $gt: '0' } } });
  const { rewardPool, pendingClaims } = await redisGetter
    .importUserClientHGetAll(`${CACHE_KEY.SMT_POOL}:${TOKEN_WAIV.SYMBOL}`);
  const rewards = parseFloat(rewardPool) / parseFloat(pendingClaims);

  for (const comment of commentsWithWaiv) {
    const waivReward = rewards * comment.voteRshareSum;
    const key = comment.authorperm.substring(1);
    const [author, permlink] = key.split('/');
    const commentReward = _.find(content, (c) => c.author === author && c.permlink === permlink);
    if (!commentReward) continue;
    commentReward.total_payout_WAIV = waivReward;
  }
};

exports.addWAIVToCommentsObject = async (content) => {
  const reqData = _.map(Object.keys(content), (c) => `@${c}`);
  const commentsWithWaiv = await commentContract.getPosts({ query: { authorperm: { $in: reqData }, symbol: TOKEN_WAIV.SYMBOL, voteRshareSum: { $gt: '0' } } });
  const { rewardPool, pendingClaims } = await redisGetter
    .importUserClientHGetAll(`${CACHE_KEY.SMT_POOL}:${TOKEN_WAIV.SYMBOL}`);
  const rewards = parseFloat(rewardPool) / parseFloat(pendingClaims);

  for (const comment of commentsWithWaiv) {
    const waivReward = rewards * comment.voteRshareSum;
    const key = comment.authorperm.substring(1);
    content[key].total_payout_WAIV = waivReward;
  }
};

exports.addWAIVToSingleComment = async (content) => {
  if (!content && !content.author && !content.permlink) return;

  const commentsWithWaiv = await commentContract
    .getPosts({ query: { authorperm: `@${content.author}/${content.permlink}`, symbol: TOKEN_WAIV.SYMBOL, voteRshareSum: { $gt: '0' } } });

  if (_.isEmpty(commentsWithWaiv)) return;
  const { rewardPool, pendingClaims } = await redisGetter
    .importUserClientHGetAll(`${CACHE_KEY.SMT_POOL}:${TOKEN_WAIV.SYMBOL}`);
  const rewards = parseFloat(rewardPool) / parseFloat(pendingClaims);

  content.total_payout_WAIV = rewards * commentsWithWaiv[0].voteRshareSum;
};

exports.usdToWaiv = async ({ amountUsd }) => {
  const hiveCurrency = await redisGetter.importUserClientHGetAll(CACHE_KEY.CURRENT_PRICE_INFO);
  const [pool] = await marketPools.getMarketPools({ query: { _id: TOKEN_WAIV.DIESEL_POOL_ID } });

  const hiveAmount = BigNumber(amountUsd).div(hiveCurrency.price);
  const waivAmount = hiveAmount.times(pool.basePrice);

  return waivAmount.dp(TOKEN_WAIV.DP).toNumber();
};

exports.getWeightToVote = async ({
  // amount in hiveEngine tokens
  amount,
  symbol,
  account,
  maxVoteWeight,
  poolId,
}) => {
  const [balances, votingPowers] = await Promise.all([
    tokensContract.getTokenBalances({ query: { symbol, account } }),
    commentContract.getVotingPower({ query: { rewardPoolId: poolId, account } }),
  ]);
  const { stake, delegationsIn } = balances[0];
  const { rewardPool, pendingClaims } = await redisGetter
    .importUserClientHGetAll(`${CACHE_KEY.SMT_POOL}:${symbol}`);
  const { votingPower } = this.calculateMana(votingPowers[0]);

  const rewards = new BigNumber(rewardPool).dividedBy(pendingClaims);
  const finalRshares = new BigNumber(stake).plus(delegationsIn);

  const reverseRshares = new BigNumber(amount).dividedBy(rewards);

  const reversePower = reverseRshares
    .times(MAX_VOTING_POWER)
    .dividedBy(finalRshares);

  const weight = reversePower
    .times(MAX_VOTING_POWER)
    .dividedBy(votingPower)
    .integerValue()
    .toNumber();

  return weight > maxVoteWeight ? maxVoteWeight : weight;
};
