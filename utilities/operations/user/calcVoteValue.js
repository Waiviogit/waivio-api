/* eslint-disable camelcase */
const { getAccount } = require('utilities/steemApi/userUtil');
const { redisGetter } = require('utilities/redis');

module.exports = async ({ user, weight }) => {
  const priceInfo = await redisGetter.importUserClientHGetAll('current_price_info');
  const { userData: account } = await getAccount(user);

  if (!priceInfo || !account) return 0;

  const { recent_claims, reward_balance, price } = priceInfo;
  const {
    vesting_shares, received_vesting_shares, delegated_vesting_shares, voting_power,
  } = account;
  const total_vests = parseFloat(vesting_shares)
    + parseFloat(received_vesting_shares)
    - parseFloat(delegated_vesting_shares);
  const final_vest = total_vests * 1e6;
  const power = ((voting_power * weight) / 10000) / 50;
  const rshares = (power * final_vest) / 10000;

  return (rshares / parseFloat(recent_claims)) * parseFloat(reward_balance) * parseFloat(price);
};
