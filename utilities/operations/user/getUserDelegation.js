const { getDelegators, getDelegations } = require('utilities/requests/getDelegationsRequests');
const _ = require('lodash');

module.exports = async ({ account }) => {
  const { delegatorsResult, delegatorsError } = await getDelegators(account);

  const { delegationsResult, delegationsError } = await getDelegations(account);
  if (delegatorsError && delegationsError) return ({ error: new Error('not Found') });

  const delegationsData = _.concat(
    _.map(delegatorsResult, (el) => {
      el.delegatee = account;
      return el;
    }),
    _.map(delegationsResult.result.delegations, (el) => {
      el.vesting_shares = +el.vesting_shares.amount;
      el.delegation_date = el.min_delegation_time;
      delete el.id;
      delete el.min_delegation_time;
      return el;
    }),
  );

  const sorted = delegationsData.sort((x, y) => new Date(y.delegation_date) - new Date(x.delegation_date));
  return { result: sorted };
};
