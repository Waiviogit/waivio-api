const { UserRcDelegationsModel } = require('../../../models');

const getIncomingDelegations = async ({ delegatee }) => UserRcDelegationsModel.findIncomingDelegations({ delegatee });

module.exports = {
  getIncomingDelegations,
};
