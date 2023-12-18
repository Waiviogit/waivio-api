const tokensContract = require('utilities/hiveEngine/tokensContract');
const tokenFunds = require('utilities/hiveEngine/tokenFunds');
const marketPools = require('utilities/hiveEngine/marketPools');
const { EngineAccountHistory } = require('models');
const BigNumber = require('bignumber.js');
const _ = require('lodash');
const currenciesRequests = require('../../requests/currenciesRequests');

const getMetrics = async () => {
  const waivToken = await tokensContract.getTokens({
    query: { symbol: 'WAIV' },
  });
  const { result: tokenRate } = await currenciesRequests.getEngineRate({ token: 'WAIV' });
  const waivToUsd = tokenRate?.USD;
  // tokens in circiulation
  const tokensInCirculation = waivToken?.circulatingSupply;

  const tokensStaked = waivToken?.totalStaked;

  const totalMarketCapitalizationUSD = BigNumber(tokensInCirculation).times(waivToUsd).toFixed();

  // constants
  const annualInflation = '4.73%';
  const inflationDistribution = {
    rewardsPool: '80%',
    developmentFund: '10%',
    liquidityProviders: '10%',
  };

  const rewardsPool = {
    authors: '50%',
    curators: '50%',
  };

  return {
    tokensInCirculation,
    tokensStaked,
    totalMarketCapitalizationUSD,
    annualInflation,
    inflationDistribution,
    rewardsPool,
  };
};

const getLiquidityProviders = async () => {
  const pool = await marketPools.getOneMarketPool({
    query: {
      tokenPair: 'SWAP.HIVE:WAIV',
    },
  });
  const positions = await marketPools.getLiquidityPositions({
    query: {
      tokenPair: 'SWAP.HIVE:WAIV',
    },
  });
  positions.sort((a, b) => b.shares - a.shares);

  const totalShares = pool?.totalShares;

  return {
    totalShares,
    positions,
  };
};

const getDevelopmentFund = async () => {
  const maxAmountPerDay = '137';

  const dayInMonth = 30;

  const { result: tokenRate } = await currenciesRequests.getEngineRate({ token: 'WAIV' });
  const waivToUsd = tokenRate?.USD;

  const availableInMonthUSD = new BigNumber(maxAmountPerDay)
    .times(dayInMonth)
    .times(waivToUsd)
    .toFixed();

  const proposals = await tokenFunds.getProposals({
    query: {
      fundId: 'WAIV:WAIV',
      active: true,
    },
  });

  const totalRequestedWaiv = _.reduce(
    proposals,
    (acc, el) => BigNumber(acc).plus(el?.amountPerDay),
    BigNumber(0),
  ).toFixed();

  const realRequest = BigNumber(totalRequestedWaiv).gt(maxAmountPerDay)
    ? maxAmountPerDay
    : totalRequestedWaiv;

  const distributedInMonthUSD = new BigNumber(maxAmountPerDay)
    .times(dayInMonth)
    .times(realRequest)
    .toFixed();

  return {
    availableInMonthUSD,
    distributedInMonthUSD,
  };
};

const getSwapHistory = async ({ skip, limit }) => {
  const { result } = await EngineAccountHistory.find({
    condition: {
      operation: 'marketpools_swapTokens',
      symbolIn: { $in: ['WAIV', 'SWAP.HIVE'] },
      symbolOut: { $in: ['WAIV', 'SWAP.HIVE'] },
    },
    skip,
    limit: limit + 1,
    sort: { timestamp: -1 },
  });

  return {
    result: _.take(result, limit),
    hasMore: result.length > limit,
  };
};

const getMainMetrics = async () => {
  const [resp1, resp2, resp3] = await Promise.all([
    getMetrics(),
    getLiquidityProviders(),
    getDevelopmentFund(),
  ]);

  return {
    ...resp1,
    ...resp2,
    ...resp3,
  };
};

module.exports = {
  getMainMetrics,
  getSwapHistory,
};
