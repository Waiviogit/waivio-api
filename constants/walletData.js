exports.WAIV_OPERATIONS_TYPES = {
  TOKENS_TRANSFER: 'tokens_transfer',
  TOKENS_STAKE: 'tokens_stake',
  CURATION_REWARDS: 'comments_curationReward',
  AUTHOR_REWARDS: 'comments_authorReward',
  BENEFICIARY_REWARD: 'comments_beneficiaryReward',
  MINING_LOTTERY: 'mining_lottery',
};

exports.MARKET_OPERATIONS = {
  MARKET_SELL: 'market_sell',
  MARKET_BUY: 'market_buy',
};

exports.ADVANCED_WALLET_TYPES = [
  this.WAIV_OPERATIONS_TYPES.TOKENS_TRANSFER,
  this.WAIV_OPERATIONS_TYPES.TOKENS_STAKE,
  this.WAIV_OPERATIONS_TYPES.AUTHOR_REWARDS,
  this.WAIV_OPERATIONS_TYPES.BENEFICIARY_REWARD,
  this.WAIV_OPERATIONS_TYPES.CURATION_REWARDS,
  this.WAIV_OPERATIONS_TYPES.MINING_LOTTERY,
];

exports.AIRDROP = 'airdrops_newAirdrop';

exports.WAIV_DB_OPERATIONS = {
  SWAP: 'marketpools_swapTokens',
};
