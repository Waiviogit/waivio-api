exports.TOKEN_WAIV = {
  SYMBOL: 'WAIV',
  POOL_ID: 13,
  DIESEL_POOL_ID: 63,
  TAGS: ['waivio', 'neoxian', 'palnet', 'waiv', 'food'],
};

exports.TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  WITHDRAW: 'withdraw',
};

exports.REDIS_ENGINE_CURATORS = 'engineCurators';

exports.MAX_VOTING_POWER = 10000;
exports.VOTE_REGENERATION_DAYS = 5;
exports.DOWNVOTE_REGENERATION_DAYS = 5;

exports.HIVE_ENGINE_NODES = [
  'https://api.hive-engine.com/rpc', // Germany
  'https://api2.hive-engine.com/rpc', // Finland
  'https://herpc.dtools.dev', // Miami
  'https://us.engine.rishipanthee.com', // Finland
  'https://ha.herpc.dtools.dev', // New Jersey
];
