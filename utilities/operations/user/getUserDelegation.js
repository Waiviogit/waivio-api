const { getDelegationExpirations } = require('../../hiveApi/userUtil');
const { DelegationModel } = require('../../../models');
const _ = require('lodash');

const formatDecimalVestingShares = (number) => (+(number / 1e6).toFixed(6));

const getUserDelegation = async ({ account }) => {
  const requests = await Promise.all([
    DelegationModel.findDelegationsTo(account),
    DelegationModel.findDelegationsFrom(account),
    getDelegationExpirations(account),
  ]);
  for (const request of requests) {
    if (_.has(request, 'error')) return ({ error: request.error });
  }

  const [delegatorsResult, delegationsResult, expirationResult] = requests;

  const received = _.filter(
    delegatorsResult,
    (e) => e.vesting_shares > 0,
  );

  const delegated = _.filter(
    delegationsResult,
    (e) => e.vesting_shares > 0,
  );

  const expirations = _.map(expirationResult, (el) => ({
    ...el,
    vesting_shares: formatDecimalVestingShares(+el.vesting_shares.amount),
  }));

  return { result: { received, delegated, expirations } };
};

module.exports = getUserDelegation;
