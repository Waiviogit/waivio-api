const { engineProxy } = require('utilities/hiveEngine/engineQuery');

exports.getMarketPools = async ({ query }) => engineProxy({
  params: {
    contract: 'marketpools',
    table: 'pools',
    query,
  },
});

exports.getOneMarketPool = async ({ query }) => engineProxy({
  method: 'findOne',
  params: {
    contract: 'marketpools',
    table: 'pools',
    query,
  },
});

exports.getLiquidityPositions = async ({ query }) => engineProxy({
  params: {
    contract: 'marketpools',
    table: 'liquidityPositions',
    query,
  },
});
