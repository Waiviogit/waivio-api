const USER_OPERATIONS_TYPES = {
  TRANSFER: 'transfer',
  TRANSFER_TO_VESTING: 'transfer_to_vesting',
  CLAIM_REWARD_BALANCE: 'claim_reward_balance',
  TRANSFER_TO_SAVINGS: 'transfer_to_savings',
  TRANSFER_FROM_SAVINGS: 'transfer_from_savings',
  LIMIT_ORDER_CREATE: 'limit_order_create',
  LIMIT_ORDER_CANCEL: 'limit_order_cancel',
  FILL_ORDER: 'fill_order',
  PROPOSAL_PAY: 'proposal_pay',
  WITHDRAW_VESTING: 'withdraw_vesting',
  FILL_VESTING_WITHDRAW: 'fill_vesting_withdraw',
  SET_WITHDRAW_VESTING_ROUTE: 'set_withdraw_vesting_route',
  FILL_COLLATERALIZED_CONVERT: 'fill_collateralized_convert_request',
  COLLATERALIZED_CONVERT: 'collateralized_convert',
  CONVERT: 'convert',
  FILL_CONVERT_REQUEST: 'fill_convert_request',
  DELEGATE_VESTING_SHARES: 'delegate_vesting_shares',
  VOTE: 'vote',
  COMMENT: 'comment',
  CUSTOM_JSON: 'custom_json',
};

const USER_OPERATIONS = Object.keys(USER_OPERATIONS_TYPES)
  .map((key) => USER_OPERATIONS_TYPES[key]);

const USER_IDENTIFIERS = {
  VOTER: 'voter',
  FROM: 'from',
  AUTHOR: 'author',
};

const SELECT_USER_CAMPAIGN_SHOP = {
  user_metadata: 1,
  name: 1,
  count_posts: 1,
  followers_count: 1,
  wobjects_weight: 1,
};

const AUTH_TYPES = ['hive-auth', 'hive-signer', 'hive-keychain', 'waivio-auth'];

module.exports = {
  SELECT_USER_CAMPAIGN_SHOP,
  USER_IDENTIFIERS,
  USER_OPERATIONS,
  USER_OPERATIONS_TYPES,
  AUTH_TYPES,
};
