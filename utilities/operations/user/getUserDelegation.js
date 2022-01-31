const { getDelegators } = require('utilities/requests/getDelegationsRequests');
const { getDelegations } = require('utilities/hiveApi/userUtil');
const _ = require('lodash');

module.exports = async ({ account }) => {
  const { result: delegatorsResult, error: delegatorsError } = await getDelegators(account);

  const { result: delegationsResult, error: delegationsError } = await getDelegations(account);
  if (delegatorsError && delegationsError) return ({ error: new Error('not Found') });

  const received = _.filter(_.map(delegatorsResult, (el) => ({ delegatee: account, ...el })), (e) => e.vesting_shares > 0);

  const delegated = _.filter(_.map(_.get(delegationsResult, 'delegations', []), (el) => ({
    ..._.omit(el, ['id', 'min_delegation_time']),
    vesting_shares: +el.vesting_shares.amount,
    delegation_date: el.min_delegation_time,
  })), (e) => e.vesting_shares > 0);

  return { result: { received, delegated } };
};
