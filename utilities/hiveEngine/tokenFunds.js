const { engineProxy } = require('utilities/hiveEngine/engineQuery');

exports.getProposals = async ({ query }) => engineProxy({
  params: {
    contract: 'tokenfunds',
    table: 'proposals',
    query,
  },
});
