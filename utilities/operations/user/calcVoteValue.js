/* eslint-disable camelcase */
const _ = require('lodash');
const { TOKEN } = require('constants/common');
const { getAccount } = require('utilities/steemApi/userUtil');
const { redisGetter, redisSetter } = require('utilities/redis');

module.exports = async ({
  userName, weight, token, author, permlink,
}) => {
  const priceInfo = await redisGetter.importUserClientHGetAll('current_price_info');
  let account = await redisGetter.importUserClientHGetAll(`temp_user_account:${userName}`);

  if (!account || _.get(account, 'author') !== author || _.get(account, 'permlink') !== permlink) {
    ({ userData: account } = await getAccount(userName));
    account && await redisSetter.importUserClientHMSet({
      key: `temp_user_account:${userName}`,
      data: Object.assign(
        _.pick(account, ['vesting_shares', 'received_vesting_shares', 'delegated_vesting_shares', 'voting_power']),
        { author, permlink },
      ),
      expire: 30,
    });
  }

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

  return token === TOKEN.HBD
    ? (rshares / parseFloat(recent_claims)) * parseFloat(reward_balance) * parseFloat(price)
    : (rshares / parseFloat(recent_claims)) * parseFloat(reward_balance);
};
