const { engineProxy } = require('./engineQuery');

exports.getProposals = async ({ query }) => engineProxy({
  params: {
    contract: 'tokenfunds',
    table: 'proposals',
    query,
  },
});
