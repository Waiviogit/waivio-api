const { getDelegators } = require('utilities/requests/getDelegationsRequests');
const { getDelegations, getDelegationExpirations } = require('utilities/hiveApi/userUtil');
const _ = require('lodash');

const getUserDelegation = async ({ account }) => {
  const requests = await Promise.all([
    // await getDelegators(account),
    await getDelegations(account),
    await getDelegationExpirations(account),
  ]);
  for (const request of requests) {
    if (_.has(request, 'error')) return ({ error: request.error });
  }

  const delegatorsResult = [];

  const [delegationsResult, expirationResult] = requests;

  const received = _.filter(
    _.map(delegatorsResult, (el) => ({
      id: +Math.random().toString(10).slice(2),
      delegatee: account,
      ...el,
    })),
    (e) => e.vesting_shares > 0,
  );

  const delegated = _.filter(_.map(delegationsResult, (el) => ({
    ..._.omit(el, ['min_delegation_time']),
    vesting_shares: +el.vesting_shares.amount,
    delegation_date: el.min_delegation_time,
  })), (e) => e.vesting_shares > 0);

  const expirations = _.map(expirationResult, (el) => ({
    ...el,
    vesting_shares: +el.vesting_shares.amount,
  }));

  return { result: { received, delegated, expirations } };
};

module.exports = getUserDelegation;
