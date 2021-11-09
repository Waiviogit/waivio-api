const engineQuery = require('utilities/hiveEngine/engineQuery');

exports.getMarketPools = async ({ query }) => engineQuery({
  params: {
    contract: 'marketpools',
    table: 'pools',
    query,
  },
});
