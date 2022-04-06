const _ = require('lodash');
const { redisGetter } = require('utilities/redis');
const { CACHE_KEY } = require('constants/common');
const commentContract = require('./commentContract');
const tokensContract = require('./tokensContract');
const marketPools = require('./marketPools');
const {
  VOTE_REGENERATION_DAYS,
  MAX_VOTING_POWER,
  DOWNVOTE_REGENERATION_DAYS,
} = require('../../constants/hiveEngine');

exports.calculateMana = (votingPower) => {
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
