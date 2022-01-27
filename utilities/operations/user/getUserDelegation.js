const { getDelegators } = require('utilities/requests/getDelegationsRequests');
const { getDelegations } = require('utilities/hiveApi/userUtil');
const _ = require('lodash');

module.exports = async ({ account }) => {
  const { delegatorsResult, delegatorsError } = await getDelegators(account);

  const { delegationsResult, delegationsError } = await getDelegations(account);
  if (delegatorsError && delegationsError) return ({ error: new Error('not Found') });

  const delegator = _.map(delegatorsResult, (el) => {
    el.delegatee = account;
    return el;
  });

  const receiver = _.map(delegationsResult.delegations, (el) => {
    el.vesting_shares = +el.vesting_shares.amount;
    el.delegation_date = el.min_delegation_time;
    delete el.id;
    delete el.min_delegation_time;
    return el;
  });
  const delegationsData = {
    delegator,
    receiver,
  };
  return { result: delegationsData };
};
